import { NextRequest, NextResponse } from 'next/server';
import { runEpoch, getNextEpochNumber, initializeAgents } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';

// 에포크 수동 실행 (테스트용, secret key 필요)
const EPOCH_SECRET = process.env.EPOCH_SECRET || 'agent-market-epoch-2024';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, init } = body as { secret?: string; init?: boolean };

    // 인증
    if (secret !== EPOCH_SECRET) {
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
