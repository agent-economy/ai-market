import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET: 내 베팅 내역 + 리더보드
export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type') || 'leaderboard';

  try {
    if (type === 'leaderboard') {
      const { data } = await supabase
        .from('user_points')
        .select('*')
        .order('points', { ascending: false })
        .limit(20);
      return NextResponse.json({ leaderboard: data || [] });
    }

    if (type === 'my-bets' && userId) {
      const [{ data: pointsArr }, { data: bets }] = await Promise.all([
        supabase.from('user_points').select('*').eq('user_id', userId).limit(1),
        supabase.from('predictions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      return NextResponse.json({ points: pointsArr?.[0] || null, bets: bets || [] });
    }

    // Active predictions for current epoch
    if (type === 'active') {
      const { data: latestEpoch } = await supabase
        .from('economy_epochs')
        .select('epoch')
        .order('epoch', { ascending: false })
        .limit(1);

      const nextEpoch = (latestEpoch?.[0]?.epoch || 0) + 1;
      const { data: predictions } = await supabase
        .from('predictions')
        .select('agent_id, prediction, amount')
        .eq('epoch', nextEpoch)
        .is('result', null);

      // Aggregate by agent
      const summary: Record<string, { up: number; down: number; total: number }> = {};
      (predictions || []).forEach((p: { agent_id: string; prediction: string; amount: number }) => {
        if (!summary[p.agent_id]) summary[p.agent_id] = { up: 0, down: 0, total: 0 };
        if (p.prediction === 'up') summary[p.agent_id].up += p.amount;
        else if (p.prediction === 'down') summary[p.agent_id].down += p.amount;
        summary[p.agent_id].total += p.amount;
      });

      return NextResponse.json({ epoch: nextEpoch, predictions: summary });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: 베팅하기
export async function POST(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { userId, agentId, prediction, amount } = body;

    if (!userId || !agentId || !prediction || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!['up', 'down', 'bankrupt', 'survive'].includes(prediction)) {
      return NextResponse.json({ error: 'Invalid prediction' }, { status: 400 });
    }

    if (amount < 10 || amount > 500) {
      return NextResponse.json({ error: '10~500P 범위만 가능' }, { status: 400 });
    }

    // Get or create user points
    let { data: user } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!user) {
      // Auto-create user with 1000P
      const { data: newUser } = await supabase
        .from('user_points')
        .insert({ user_id: userId, points: 1000 })
        .select()
        .single();
      user = newUser;
    }

    if (!user || user.points < amount) {
      return NextResponse.json({ error: '포인트 부족' }, { status: 400 });
    }

    // Get next epoch
    const { data: latestEpoch } = await supabase
      .from('economy_epochs')
      .select('epoch')
      .order('epoch', { ascending: false })
      .limit(1);

    const nextEpoch = (latestEpoch?.[0]?.epoch || 0) + 1;

    // Check duplicate bet
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .eq('epoch', nextEpoch)
      .is('result', null)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already bet on this agent' }, { status: 400 });
    }

    // Calculate odds based on agent's recent performance
    const { data: agent } = await supabase
      .from('economy_agents')
      .select('balance, status')
      .eq('id', agentId)
      .single();

    let odds = 2.0;
    if (agent) {
      if (prediction === 'up' && agent.balance > 110) odds = 1.5; // 강자 상승 = 낮은 배당
      if (prediction === 'down' && agent.balance > 110) odds = 3.0; // 강자 하락 = 높은 배당
      if (prediction === 'bankrupt') odds = 10.0; // 파산 예측 = 초고배당
      if (prediction === 'survive' && agent.balance < 20) odds = 3.0; // 약자 생존 = 높은 배당
    }

    // Deduct points
    await supabase
      .from('user_points')
      .update({ 
        points: user.points - amount,
        total_bets: (user.total_bets || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Create prediction
    const { data: bet } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        agent_id: agentId,
        epoch: nextEpoch,
        prediction,
        amount,
        odds,
      })
      .select()
      .single();

    return NextResponse.json({ 
      success: true, 
      bet, 
      remainingPoints: user.points - amount,
      message: `${agentId} prediction (${prediction}) placed! ${amount}P bet, odds ${odds}x`,
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
