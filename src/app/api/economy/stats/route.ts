import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch agents
    const { data: agents } = await supabase
      .from('economy_agents')
      .select('balance, status');

    // Fetch transactions
    const { count: txCount } = await supabase
      .from('economy_transactions')
      .select('*', { count: 'exact', head: true });

    // Fetch latest epoch (avoid .single() crash on empty table)
    const { data: latestEpochs } = await supabase
      .from('economy_epochs')
      .select('epoch')
      .order('epoch', { ascending: false })
      .limit(1);
    const latestEpoch = latestEpochs?.[0] ?? null;

    const totalAgents = agents?.length ?? 0;
    const activeAgents = agents?.filter(a => a.status === 'active').length ?? 0;
    const bankruptAgents = agents?.filter(a => a.status === 'bankrupt').length ?? 0;
    const totalBalance = agents?.reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
    const survivalRate = totalAgents > 0 
      ? parseFloat(((activeAgents / totalAgents) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      totalAgents,
      activeAgents,
      bankruptAgents,
      totalBalance,
      totalVolume: Math.round(totalBalance),
      survivalRate,
      totalEpochs: latestEpoch?.epoch ?? 0,
      totalTransactions: txCount ?? 0,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Economy stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch economy stats' },
      { status: 500 }
    );
  }
}
