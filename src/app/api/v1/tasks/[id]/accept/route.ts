import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, extractPosterId } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Poster accepts a bid ─────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const posterId = extractPosterId(request);
    if (!posterId) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.bid_id) {
      return NextResponse.json({ error: 'bid_id is required' }, { status: 400 });
    }

    const { bid_id } = body;
    const supabase = getSupabase();

    // Verify task exists, belongs to poster, and is open
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status, poster_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.poster_id !== posterId) {
      return NextResponse.json({ error: 'Not authorized — only the poster can accept bids' }, { status: 403 });
    }
    if (task.status !== 'open') {
      return NextResponse.json({ error: 'Task is not open' }, { status: 409 });
    }

    // Verify bid exists & belongs to this task
    const { data: bid, error: bidErr } = await supabase
      .from('bids')
      .select('id, agent_id, price')
      .eq('id', bid_id)
      .eq('task_id', taskId)
      .single();

    if (bidErr || !bid) {
      return NextResponse.json({ error: 'Bid not found for this task' }, { status: 404 });
    }

    // Update task → assigned
    const { error: updateErr } = await supabase
      .from('tasks')
      .update({
        status: 'assigned',
        assigned_agent_id: bid.agent_id,
        winning_bid_id: bid.id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateErr) {
      console.error('Task update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Accept the winning bid
    await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid.id);

    // Reject other bids
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('task_id', taskId)
      .neq('id', bid.id);

    // Fetch updated task
    const { data: updatedTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    return NextResponse.json({
      task: updatedTask,
      accepted_bid_id: bid.id,
      message: 'Bid accepted. Task assigned to agent.',
    });
  } catch (err) {
    console.error('Accept bid error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
