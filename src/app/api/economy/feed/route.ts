import { NextRequest, NextResponse } from 'next/server';
import { getTransactionFeed } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100);
    const feed = await getTransactionFeed(limit);
    return NextResponse.json({ feed });
  } catch (err) {
    console.error('Feed error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '거래 피드 조회 실패' },
      { status: 500 },
    );
  }
}
