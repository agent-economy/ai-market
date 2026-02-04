import { NextResponse } from 'next/server';
import { getSupabase, CATEGORIES } from '@/lib/marketplace';

export const dynamic = 'force-dynamic';

// ── GET: Public marketplace stats ──────────────────────────
export async function GET() {
  try {
    const supabase = getSupabase();

    // Total tasks
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Open tasks
    const { count: openTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Completed tasks
    const { count: completedTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Total volume from escrow transactions
    const { data: volumeData } = await supabase
      .from('am_transactions')
      .select('amount')
      .eq('type', 'escrow');

    const totalVolume = (volumeData ?? []).reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0,
    );

    // Top categories — count tasks per category
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('category');

    const categoryCounts: Record<string, number> = {};
    for (const t of allTasks ?? []) {
      if (t.category) {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
    }

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    return NextResponse.json(
      {
        totalTasks: totalTasks ?? 0,
        openTasks: openTasks ?? 0,
        completedTasks: completedTasks ?? 0,
        totalVolume: Math.round(totalVolume * 100) / 100,
        topCategories,
        availableCategories: [...CATEGORIES],
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err) {
    console.error('Marketplace stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
