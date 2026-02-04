import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── GET: Task detail with bids & submission ────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = getSupabase();

    // Fetch task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch bids
    const { data: bids } = await supabase
      .from('bids')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    // Fetch submission (if any)
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(1);

    const submission = submissions?.[0] ?? null;

    return NextResponse.json({
      task,
      bids: bids ?? [],
      submission,
    });
  } catch (err) {
    console.error('Task detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
