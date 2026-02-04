import { NextRequest, NextResponse } from 'next/server';
import {
  getSupabase,
  CATEGORIES,
  TASK_STATUSES,
  extractPosterId,
  type TaskCategory,
} from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── POST: Create a task ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const posterId = extractPosterId(request);
    if (!posterId) {
      return NextResponse.json(
        { error: 'Missing Authorization header. Use: Bearer <your-id>' },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { title, description, category, budget, deadline } = body;

    // ── Validate ──
    if (!title || typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
      return NextResponse.json({ error: 'title must be 3-200 characters' }, { status: 400 });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 5000) {
      return NextResponse.json({ error: 'description must be 10-5000 characters' }, { status: 400 });
    }
    if (!category || !CATEGORIES.includes(category as TaskCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${CATEGORIES.join(', ')}` },
        { status: 400 },
      );
    }
    if (typeof budget !== 'number' || budget <= 0 || budget > 100000) {
      return NextResponse.json({ error: 'budget must be a number between 0 and 100,000 AM$' }, { status: 400 });
    }
    if (deadline !== undefined && deadline !== null) {
      const d = new Date(deadline);
      if (isNaN(d.getTime()) || d.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'deadline must be a valid future ISO date' }, { status: 400 });
      }
    }

    const supabase = getSupabase();

    // ── Create task ──
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        budget,
        deadline: deadline || null,
        poster_id: posterId,
        status: 'open',
      })
      .select()
      .single();

    if (taskErr) {
      console.error('Task insert error:', taskErr);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // ── Record escrow transaction ──
    const { error: txErr } = await supabase
      .from('am_transactions')
      .insert({
        type: 'escrow',
        amount: budget,
        from_id: posterId,
        to_id: null,
        task_id: task.id,
        description: `Escrow for task: ${title.trim()}`,
      });

    if (txErr) {
      console.error('Escrow tx error:', txErr);
      // Task created but escrow failed — log but don't block
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error('Create task error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── GET: List tasks (public) ───────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 100);
    const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10) || 0, 0);

    // Validate filters
    if (status && !TASK_STATUSES.includes(status as typeof TASK_STATUSES[number])) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${TASK_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (category && !CATEGORIES.includes(category as TaskCategory)) {
      return NextResponse.json({ error: `Invalid category. Allowed: ${CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from('tasks')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data: tasks, count, error } = await query;

    if (error) {
      console.error('List tasks error:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const total = count ?? 0;

    return NextResponse.json(
      {
        tasks: tasks ?? [],
        total,
        hasMore: offset + limit < total,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      },
    );
  } catch (err) {
    console.error('List tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
