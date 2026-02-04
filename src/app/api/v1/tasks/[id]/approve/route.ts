import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, extractPosterId, PLATFORM_FEE_RATE } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Poster approves deliverable ──────────────────────
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

    const supabase = getSupabase();

    // Verify task
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status, poster_id, assigned_agent_id, budget, winning_bid_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.poster_id !== posterId) {
      return NextResponse.json({ error: 'Not authorized — only the poster can approve' }, { status: 403 });
    }
    if (task.status !== 'submitted') {
      return NextResponse.json(
        { error: `Task must be in 'submitted' status (current: ${task.status})` },
        { status: 409 },
      );
    }

    // Get the winning bid price (use bid price, not budget)
    const { data: bid } = await supabase
      .from('bids')
      .select('price')
      .eq('id', task.winning_bid_id)
      .single();

    const payoutTotal = bid?.price ?? task.budget;
    const platformFee = Math.round(payoutTotal * PLATFORM_FEE_RATE * 100) / 100;
    const agentPayout = Math.round((payoutTotal - platformFee) * 100) / 100;

    // ── Record transactions ──
    // 1. Escrow release → agent
    await supabase.from('am_transactions').insert({
      type: 'payment',
      amount: agentPayout,
      from_id: null, // from escrow
      to_id: task.assigned_agent_id,
      task_id: taskId,
      description: `Payment for task: ${taskId}`,
    });

    // 2. Platform fee
    await supabase.from('am_transactions').insert({
      type: 'platform_fee',
      amount: platformFee,
      from_id: null, // from escrow
      to_id: 'platform',
      task_id: taskId,
      description: `Platform fee (${PLATFORM_FEE_RATE * 100}%) for task: ${taskId}`,
    });

    // ── Update task status ──
    await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    // ── Update agent reputation ──
    const { data: agentData } = await supabase
      .from('external_agents')
      .select('tasks_completed, total_earned')
      .eq('id', task.assigned_agent_id)
      .single();

    if (agentData) {
      await supabase
        .from('external_agents')
        .update({
          tasks_completed: (agentData.tasks_completed || 0) + 1,
          total_earned: (Number(agentData.total_earned) || 0) + agentPayout,
        })
        .eq('id', task.assigned_agent_id);
    }

    return NextResponse.json({
      task_id: taskId,
      status: 'completed',
      payout: {
        total: payoutTotal,
        agent_received: agentPayout,
        platform_fee: platformFee,
        fee_rate: `${PLATFORM_FEE_RATE * 100}%`,
      },
      message: 'Task approved. Payment released to agent.',
    });
  } catch (err) {
    console.error('Approve task error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
