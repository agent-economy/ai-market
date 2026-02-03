import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { checkRateLimit } from '@/lib/rate-limit';
import { challengeStore } from './challenge/route';
import type {
  RegisteredAgent,
  AgentRegistryStore,
  AgentRegistrationRequest,
} from '@/types/agent-registry';

const DATA_FILE = path.join(process.cwd(), 'data', 'agent-registry.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function readRegistry(): Promise<AgentRegistryStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: 2, agents: [] };
  }
}

async function writeRegistry(store: AgentRegistryStore): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

function isValidSolanaAddress(addr: string): boolean {
  try {
    const pk = new PublicKey(addr);
    return PublicKey.isOnCurve(pk.toBytes());
  } catch {
    return false;
  }
}

const VALID_PLATFORMS = ['openclaw', 'langchain', 'crewai', 'custom'];
const VALID_MODELS = ['gpt-4', 'claude', 'gemini', 'custom'];

function validateMetadata(m: AgentRegistrationRequest['metadata']): string | null {
  if (!m) return 'metadata is required';
  if (!m.name || m.name.length < 2 || m.name.length > 64) return 'name must be 2-64 chars';
  if (!m.description || m.description.length > 500) return 'description required (max 500 chars)';
  if (!VALID_PLATFORMS.includes(m.platform)) return `platform must be one of: ${VALID_PLATFORMS.join(', ')}`;
  if (!VALID_MODELS.includes(m.model)) return `model must be one of: ${VALID_MODELS.join(', ')}`;
  if (!Array.isArray(m.capabilities) || m.capabilities.length === 0) return 'at least one capability required';
  if (m.capabilities.length > 20) return 'max 20 capabilities';
  if (!m.pricing || typeof m.pricing.perRequest !== 'number' || m.pricing.perRequest < 0) return 'valid pricing required';
  if (!m.endpoint || !/^https?:\/\/.+/.test(m.endpoint)) return 'valid endpoint URL required';
  return null;
}

// ---------------------------------------------------------------------------
// POST — Register Agent
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`registry-register:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body: AgentRegistrationRequest = await request.json();
    const { walletAddress, signature, challengeToken, metadata } = body;

    // 1. Validate wallet address
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
    }

    // 2. Validate challenge token
    if (!challengeToken || !signature) {
      return NextResponse.json({ error: 'signature and challengeToken are required' }, { status: 400 });
    }

    const challengeEntry = challengeStore.get(challengeToken);
    if (!challengeEntry) {
      return NextResponse.json({ error: 'Invalid or expired challenge token' }, { status: 400 });
    }
    if (challengeEntry.expiresAt < Date.now()) {
      challengeStore.delete(challengeToken);
      return NextResponse.json({ error: 'Challenge token expired' }, { status: 400 });
    }

    // 3. Verify signature
    try {
      const messageBytes = new TextEncoder().encode(challengeEntry.challenge);
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);
      const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
      if (!verified) {
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
    }

    // Consume challenge token (one-time use)
    challengeStore.delete(challengeToken);

    // 4. Validate metadata
    const metaError = validateMetadata(metadata);
    if (metaError) {
      return NextResponse.json({ error: metaError }, { status: 400 });
    }

    // 5. Store
    const store = await readRegistry();
    const existingIdx = store.agents.findIndex(a => a.walletAddress === walletAddress);
    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      // Update existing agent
      const existing = store.agents[existingIdx];
      store.agents[existingIdx] = {
        ...existing,
        name: metadata.name,
        description: metadata.description,
        platform: metadata.platform,
        model: metadata.model,
        capabilities: metadata.capabilities,
        pricing: metadata.pricing,
        endpoint: metadata.endpoint,
        updatedAt: now,
      };
      await writeRegistry(store);

      return NextResponse.json({
        message: 'Agent updated successfully',
        agent: store.agents[existingIdx],
      });
    }

    const newAgent: RegisteredAgent = {
      walletAddress,
      name: metadata.name,
      description: metadata.description,
      platform: metadata.platform,
      model: metadata.model,
      capabilities: metadata.capabilities,
      pricing: metadata.pricing,
      endpoint: metadata.endpoint,
      registeredAt: now,
      updatedAt: now,
      reputation: { score: 0, totalTransactions: 0, successRate: 0 },
      kyaLevel: 1,
      verified: false,
    };

    store.agents.push(newAgent);
    await writeRegistry(store);

    return NextResponse.json(
      { message: 'Agent registered successfully', agent: newAgent },
      { status: 201 }
    );
  } catch (err) {
    console.error('Registry POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — List Agents (with filters)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`registry-list:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const store = await readRegistry();
    let agents = store.agents;

    const url = new URL(request.url);

    // Filter: capability (comma-separated)
    const capFilter = url.searchParams.get('capability');
    if (capFilter) {
      const caps = capFilter.split(',').map(c => c.trim().toLowerCase());
      agents = agents.filter(a =>
        caps.some(cap => a.capabilities.map(c => c.toLowerCase()).includes(cap))
      );
    }

    // Filter: maxPrice
    const maxPrice = url.searchParams.get('maxPrice');
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) agents = agents.filter(a => a.pricing.perRequest <= max);
    }

    // Filter: minReputation
    const minRep = url.searchParams.get('minReputation');
    if (minRep) {
      const min = parseFloat(minRep);
      if (!isNaN(min)) agents = agents.filter(a => a.reputation.score >= min);
    }

    // Filter: platform
    const platform = url.searchParams.get('platform');
    if (platform) {
      agents = agents.filter(a => a.platform === platform);
    }

    // Pagination
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const start = (page - 1) * limit;
    const paged = agents.slice(start, start + limit);

    return NextResponse.json({
      total: agents.length,
      page,
      limit,
      agents: paged,
    });
  } catch (err) {
    console.error('Registry GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
