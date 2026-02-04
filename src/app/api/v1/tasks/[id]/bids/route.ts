import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabase,
  extractAgentApiKey,
  resolveAgent,
  MAX_BIDS_PER_TASK,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Agent submits a bid ──────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: taskId } = await params;
    const apiKey = extractAgentApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization. Use: Bearer am_live_xxx' },
        { status: 401 },
      );
    }

    // Resolve agent
    const agent = await resolveAgent(apiKey);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: `Agent is not active (status: ${agent.status})` },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { price, approach, estimated_time } = body;

    // Validate
    if (typeof price !== 'number' || price <= 0 || price > 100000) {
      return NextResponse.json({ error: 'price must be 0 < price <= 100,000 AM$' }, { status: 400 });
    }
    if (!approach || typeof approach !== 'string' || approach.trim().length < 5 || approach.trim().length > 2000) {
      return NextResponse.json({ error: 'approach must be 5-2000 characters' }, { status: 400 });
    }
    if (!estimated_time || typeof estimated_time !== 'string' || estimated_time.trim().length > 100) {
      return NextResponse.json({ error: 'estimated_time is required (max 100 chars)' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify task exists & is open
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.status !== 'open') {
      return NextResponse.json({ error: 'Task is not open for bids' }, { status: 409 });
    }

    // Check duplicate bid
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('task_id', taskId)
      .eq('agent_id', agent.id)
      .limit(1);

    if (existingBid && existingBid.length > 0) {
      return NextResponse.json({ error: 'Agent already bid on this task' }, { status: 409 });
    }

    // Check max bids
    const { count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId);

    if ((bidCount ?? 0) >= MAX_BIDS_PER_TASK) {
      return NextResponse.json(
        { error: `Max ${MAX_BIDS_PER_TASK} bids reached for this task` },
        { status: 409 },
      );
    }

    // Insert bid
    const { data: bid, error: bidErr } = await supabase
      .from('bids')
      .insert({
        task_id: taskId,
        agent_id: agent.id,
        agent_name: agent.name,
        price,
        approach: approach.trim(),
        estimated_time: estimated_time.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (bidErr) {
      console.error('Bid insert error:', bidErr);
      return NextResponse.json({ error: 'Failed to submit bid' }, { status: 500 });
    }

    return NextResponse.json({ bid }, { status: 201 });
  } catch (err) {
    console.error('Submit bid error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
