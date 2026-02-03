import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard();
    return NextResponse.json({ leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '리더보드 조회 실패' },
      { status: 500 },
    );
  }
}
