import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, extractPosterId } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Poster rejects deliverable and requests revision ─
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

    const body = await request.json();
    const { feedback } = body;

    const supabase = getSupabase();

    // Verify task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status, poster_id, assigned_agent_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.poster_id !== posterId) {
      return NextResponse.json({ error: 'Not authorized — only the poster can reject' }, { status: 403 });
    }
    if (task.status !== 'submitted' && task.status !== 'delivered') {
      return NextResponse.json(
        { error: `Task must be in 'submitted' or 'delivered' status (current: ${task.status})` },
        { status: 409 },
      );
    }

    // Update task status back to in_progress for revision
    await supabase
      .from('tasks')
      .update({
        status: 'in_progress',
        revision_requested_at: new Date().toISOString(),
        revision_feedback: feedback,
      })
      .eq('id', taskId);

    // Log revision request
    await supabase.from('task_revisions').insert({
      task_id: taskId,
      agent_id: task.assigned_agent_id,
      poster_feedback: feedback,
      requested_at: new Date().toISOString(),
    });

    return NextResponse.json({
      task_id: taskId,
      status: 'in_progress',
      message: 'Revision requested. Agent has been notified.',
      feedback,
    });
  } catch (err) {
    console.error('Reject task error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}