import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST: 에포크 완료 후 베팅 정산
export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { epoch, secret } = await req.json();
    
    if (secret !== process.env.ECONOMY_EPOCH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unsettled predictions for this epoch
    const { data: bets } = await supabase
      .from('predictions')
      .select('*')
      .eq('epoch', epoch)
      .is('result', null);

    if (!bets || bets.length === 0) {
      return NextResponse.json({ settled: 0, message: 'No bets to settle' });
    }

    // Get current epoch's agent states
    const { data: agents } = await supabase
      .from('economy_agents')
      .select('id, balance, status');

    // Get previous epoch balances (from transactions or estimate)
    const { data: prevEpochArr } = await supabase
      .from('economy_epochs')
      .select('*')
      .eq('epoch', epoch - 1)
      .limit(1);
    const prevEpoch = prevEpochArr?.[0] || null;

    const agentMap = new Map((agents || []).map(a => [a.id, a]));
    
    let settledCount = 0;
    const results: Array<{ betId: string; result: string; payout: number }> = [];

    for (const bet of bets) {
      const agent = agentMap.get(bet.agent_id);
      if (!agent) continue;

      // Determine if prediction was correct
      // For simplicity: compare with $100 start or estimate trend
      const prevBalance = 100; // Simplified — in production would track per-epoch
      const currentBalance = agent.balance;
      const went_up = currentBalance > prevBalance;
      const went_bankrupt = agent.status === 'bankrupt';

      let won = false;
      if (bet.prediction === 'up' && went_up) won = true;
      if (bet.prediction === 'down' && !went_up && !went_bankrupt) won = true;
      if (bet.prediction === 'bankrupt' && went_bankrupt) won = true;
      if (bet.prediction === 'survive' && !went_bankrupt) won = true;

      const payout = won ? Math.round(bet.amount * bet.odds) : 0;
      const result = won ? 'win' : 'lose';

      // Update prediction
      await supabase
        .from('predictions')
        .update({ result, payout, settled_at: new Date().toISOString() })
        .eq('id', bet.id);

      // Update user points
      if (won) {
        const { data: user } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', bet.user_id)
          .single();

        if (user) {
          const newStreak = (user.win_streak || 0) + 1;
          await supabase
            .from('user_points')
            .update({
              points: user.points + payout,
              total_won: (user.total_won || 0) + 1,
              win_streak: newStreak,
              best_streak: Math.max(newStreak, user.best_streak || 0),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', bet.user_id);
        }
      } else {
        const { data: user } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', bet.user_id)
          .single();

        if (user) {
          await supabase
            .from('user_points')
            .update({
              total_lost: (user.total_lost || 0) + 1,
              win_streak: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', bet.user_id);
        }
      }

      results.push({ betId: bet.id, result, payout });
      settledCount++;
    }

    return NextResponse.json({ 
      settled: settledCount,
      results,
      epoch,
    });
  } catch (error) {
    console.error('Settlement error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
