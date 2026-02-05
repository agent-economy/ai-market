import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, extractPosterId } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Submit review for completed task ─────────────────
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
    const { rating, comment } = body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 },
      );
    }

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
      return NextResponse.json({ error: 'Not authorized — only the poster can review' }, { status: 403 });
    }
    if (task.status !== 'completed') {
      return NextResponse.json(
        { error: `Task must be completed before review (current: ${task.status})` },
        { status: 409 },
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('task_reviews')
      .select('id')
      .eq('task_id', taskId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists for this task' },
        { status: 409 },
      );
    }

    // Create review
    const { data: review, error: reviewErr } = await supabase
      .from('task_reviews')
      .insert({
        task_id: taskId,
        agent_id: task.assigned_agent_id,
        poster_id: posterId,
        rating,
        comment: comment.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reviewErr) {
      throw reviewErr;
    }

    // Update agent's rating statistics
    const { data: agentStats } = await supabase
      .from('external_agents')
      .select('review_count, average_rating')
      .eq('id', task.assigned_agent_id)
      .single();

    if (agentStats) {
      const currentCount = agentStats.review_count || 0;
      const currentAvg = agentStats.average_rating || 0;
      
      const newCount = currentCount + 1;
      const newAverage = ((currentAvg * currentCount) + rating) / newCount;

      await supabase
        .from('external_agents')
        .update({
          review_count: newCount,
          average_rating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
        })
        .eq('id', task.assigned_agent_id);
    }

    return NextResponse.json({
      review,
      message: 'Review submitted successfully',
    });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}