import { NextRequest, NextResponse } from 'next/server';
import { runEpoch, getNextEpochNumber, initializeAgents } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for Gemini calls

const EPOCH_SECRET = process.env.ECONOMY_EPOCH_SECRET!;
const CRON_SECRET = process.env.CRON_SECRET; // Vercel cron auto-injected

/** Check authentication from header or body */
function isAuthorized(req: NextRequest, bodySecret?: string): boolean {
  const authHeader = req.headers.get('authorization');
  // Header-based auth (Vercel cron / external calls)
  if (authHeader === `Bearer ${EPOCH_SECRET}`) return true;
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  // Body-based auth (manual POST calls)
  if (bodySecret === EPOCH_SECRET) return true;
  return false;
}

// GET: Vercel Cron handler — runs a single epoch
export async function GET(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const epochNumber = await getNextEpochNumber();
    const result = await runEpoch(epochNumber);

    return NextResponse.json({
      success: true,
      epoch: result.epoch,
      event: result.events,
      transactionCount: result.transactions.length,
      bankruptcies: result.bankruptcies,
    });
  } catch (err) {
    console.error('Cron epoch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '에포크 실행 실패' },
      { status: 500 },
    );
  }
}

// POST: Manual epoch execution (existing interface)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, init } = body as { secret?: string; init?: boolean };

    // 인증 (header or body)
    if (!isAuthorized(req, secret)) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    // 초기화 요청
    if (init) {
      const result = await initializeAgents();
      return NextResponse.json(result);
    }

    // 에포크 실행
    const epochNumber = await getNextEpochNumber();
    const result = await runEpoch(epochNumber);

    return NextResponse.json({
      success: true,
      epoch: result.epoch,
      event: result.events,
      transactionCount: result.transactions.length,
      transactions: result.transactions,
      bankruptcies: result.bankruptcies,
      agents: result.agents.map(a => ({
        id: a.id,
        name: a.name,
        balance: Number(a.balance),
        status: a.status,
      })),
    });
  } catch (err) {
    console.error('Epoch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '에포크 실행 실패' },
      { status: 500 },
    );
  }
}
