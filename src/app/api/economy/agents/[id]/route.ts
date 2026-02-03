import { NextRequest, NextResponse } from 'next/server';
import { getAgentDetail } from '@/lib/economy-engine';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const agent = await getAgentDetail(id);

    if (!agent) {
      return NextResponse.json({ error: '에이전트를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (err) {
    console.error('Agent detail error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '에이전트 조회 실패' },
      { status: 500 },
    );
  }
}
