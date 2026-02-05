import { NextRequest, NextResponse } from 'next/server';
import { getEditUsage } from '@/lib/edit-limits';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Get session ID from header or cookie
    const sessionId = req.headers.get('x-session-id') || 
      req.cookies.get('session_id')?.value ||
      'anonymous';

    // Try to get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const usage = await getEditUsage(userId, sessionId);

    return NextResponse.json({
      ...usage,
      remaining: usage.limitCount === -1 
        ? '무제한' 
        : Math.max(0, usage.limitCount - usage.currentCount),
      month: new Date().toISOString().slice(0, 7),
    });
  } catch (err) {
    console.error('[usage] Error:', err);
    return NextResponse.json(
      { error: '사용량 조회 실패' },
      { status: 500 }
    );
  }
}
