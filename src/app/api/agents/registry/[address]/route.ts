import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { AgentRegistryStore } from '@/types/agent-registry';
import { checkRateLimit } from '@/lib/rate-limit';

const DATA_FILE = path.join(process.cwd(), 'data', 'agent-registry.json');

async function readRegistry(): Promise<AgentRegistryStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: 2, agents: [] };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`registry-detail:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const { address } = await params;

    // Basic Solana address format check
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    const store = await readRegistry();
    const agent = store.agents.find(a => a.walletAddress === address);

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json({ agent });
  } catch (err) {
    console.error('Registry detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
