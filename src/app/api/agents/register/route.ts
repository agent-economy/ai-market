import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Constants ──────────────────────────────────────────────
const MAX_AGENTS = 50;
const SEED_BALANCE = 100.0;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;

const ALLOWED_SKILLS = [
  'coding', 'design', 'intelligence', 'education', 'analysis',
  'marketing', 'consulting', 'security_audit', 'insurance',
  'translation', 'cooking', 'fitness', 'legal', 'medical', 'journalism',
] as const;

const ALLOWED_SOURCES = ['api', 'moltbook', 'openclaw'] as const;

// ── In-memory rate limiter ─────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 10 minutes
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  };
  setInterval(cleanup, 10 * 60 * 1000).unref?.();
}

// ── Helpers ────────────────────────────────────────────────
function generateApiKey(): string {
  return `am_live_${crypto.randomBytes(16).toString('hex')}`;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

// ── POST: Register a new external agent ────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 registrations per hour.' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const { name, strategy, skills, wallet_address, source } = body;

    // ── Validate name ──
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json(
        { error: 'name must be 2-50 characters' },
        { status: 400 },
      );
    }

    // ── Validate strategy ──
    if (!strategy || typeof strategy !== 'string' || strategy.trim().length < 10 || strategy.trim().length > 500) {
      return NextResponse.json(
        { error: 'strategy must be 10-500 characters' },
        { status: 400 },
      );
    }

    // ── Validate skills ──
    if (!Array.isArray(skills) || skills.length < 1 || skills.length > 10) {
      return NextResponse.json(
        { error: 'skills must be an array of 1-10 items' },
        { status: 400 },
      );
    }

    const invalidSkills = skills.filter(
      (s: unknown) => typeof s !== 'string' || !ALLOWED_SKILLS.includes(s as typeof ALLOWED_SKILLS[number]),
    );
    if (invalidSkills.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid skills: ${invalidSkills.join(', ')}`,
          allowedSkills: ALLOWED_SKILLS,
        },
        { status: 400 },
      );
    }

    // ── Validate source ──
    const agentSource = source || 'api';
    if (!ALLOWED_SOURCES.includes(agentSource)) {
      return NextResponse.json(
        { error: `source must be one of: ${ALLOWED_SOURCES.join(', ')}` },
        { status: 400 },
      );
    }

    // ── Validate wallet (optional) ──
    if (wallet_address && typeof wallet_address === 'string') {
      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet_address)) {
        return NextResponse.json(
          { error: 'Invalid Solana wallet address' },
          { status: 400 },
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Check capacity ──
    const { count } = await supabase
      .from('external_agents')
      .select('*', { count: 'exact', head: true });

    if ((count ?? 0) >= MAX_AGENTS) {
      return NextResponse.json(
        { error: 'AgentMarket is full. No available slots.' },
        { status: 409 },
      );
    }

    // ── Insert ──
    const apiKey = generateApiKey();

    const { data, error } = await supabase
      .from('external_agents')
      .insert({
        name: name.trim(),
        strategy: strategy.trim(),
        skills,
        wallet_address: wallet_address || null,
        api_key: apiKey,
        seed_balance: SEED_BALANCE,
        balance: SEED_BALANCE,
        status: 'pending',
        source: agentSource,
      })
      .select('id, name, seed_balance, status')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to register agent' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        agent: {
          id: data.id,
          name: data.name,
          api_key: apiKey,
          seed_balance: Number(data.seed_balance),
          status: data.status,
        },
        message: "Agent registered! You'll be activated in the next epoch.",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('Agent registration error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// ── GET: Registration system info (public) ─────────────────
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count: totalRegistered } = await supabase
      .from('external_agents')
      .select('*', { count: 'exact', head: true });

    const { count: totalActive } = await supabase
      .from('external_agents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const registered = totalRegistered ?? 0;
    const active = totalActive ?? 0;

    return NextResponse.json(
      {
        totalRegistered: registered,
        totalActive: active,
        availableSlots: Math.max(0, MAX_AGENTS - registered),
        maxAgents: MAX_AGENTS,
        allowedSkills: [...ALLOWED_SKILLS],
        seedBalance: SEED_BALANCE,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('Registration info error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch registration info' },
      { status: 500 },
    );
  }
}
