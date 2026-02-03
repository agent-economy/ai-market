import { NextResponse } from 'next/server';
import { getEconomyStats } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getEconomyStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '경제 지표 조회 실패' },
      { status: 500 },
    );
  }
}
