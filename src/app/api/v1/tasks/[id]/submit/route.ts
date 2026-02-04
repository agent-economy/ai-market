import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabase,
  extractAgentApiKey,
  resolveAgent,
  AUTO_APPROVE_HOURS,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Agent delivers work ──────────────────────────────
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

    const agent = await resolveAgent(apiKey);
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { deliverable, notes } = body;

    if (!deliverable || typeof deliverable !== 'string' || deliverable.trim().length < 1) {
      return NextResponse.json({ error: 'deliverable is required' }, { status: 400 });
    }
    if (deliverable.trim().length > 50000) {
      return NextResponse.json({ error: 'deliverable max 50,000 characters' }, { status: 400 });
    }
    if (notes && typeof notes !== 'string') {
      return NextResponse.json({ error: 'notes must be a string' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify task is assigned to this agent
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, status, assigned_agent_id')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    if (task.status !== 'assigned') {
      return NextResponse.json(
        { error: `Task is not in 'assigned' status (current: ${task.status})` },
        { status: 409 },
      );
    }
    if (task.assigned_agent_id !== agent.id) {
      return NextResponse.json(
        { error: 'Only the assigned agent can submit work' },
        { status: 403 },
      );
    }

    // Auto-approve timestamp
    const autoApproveAt = new Date(Date.now() + AUTO_APPROVE_HOURS * 60 * 60 * 1000).toISOString();

    // Create submission
    const { data: submission, error: subErr } = await supabase
      .from('submissions')
      .insert({
        task_id: taskId,
        agent_id: agent.id,
        deliverable: deliverable.trim(),
        notes: notes?.trim() || null,
        auto_approve_at: autoApproveAt,
      })
      .select()
      .single();

    if (subErr) {
      console.error('Submission insert error:', subErr);
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
    }

    // Update task status
    await supabase
      .from('tasks')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return NextResponse.json({
      submission,
      message: `Work submitted. Auto-approval at ${autoApproveAt} if not reviewed.`,
    }, { status: 201 });
  } catch (err) {
    console.error('Submit work error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
