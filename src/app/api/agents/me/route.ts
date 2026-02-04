import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Helper: extract bearer token ───────────────────────────
function extractApiKey(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token.startsWith('am_live_')) return null;
  return token;
}

// ── GET: Agent profile + balance ───────────────────────────
export async function GET(request: NextRequest) {
  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer am_live_xxx' },
        { status: 401 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up agent by API key
    const { data: agent, error } = await supabase
      .from('external_agents')
      .select('id, name, strategy, skills, wallet_address, seed_balance, balance, total_earned, total_spent, status, source, created_at, activated_at, last_active')
      .eq('api_key', apiKey)
      .single();

    if (error || !agent) {
      return NextResponse.json(
        { error: 'Agent not found. Check your API key.' },
        { status: 404 },
      );
    }

    // Update last_active timestamp
    await supabase
      .from('external_agents')
      .update({ last_active: new Date().toISOString() })
      .eq('api_key', apiKey);

    // Compute some derived stats
    const profitLoss = Number(agent.balance) - Number(agent.seed_balance);
    const roi = Number(agent.seed_balance) > 0
      ? ((profitLoss / Number(agent.seed_balance)) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
        strategy: agent.strategy,
        skills: agent.skills,
        wallet_address: agent.wallet_address,
        status: agent.status,
        source: agent.source,
        created_at: agent.created_at,
        activated_at: agent.activated_at,
        last_active: agent.last_active,
      },
      financials: {
        seed_balance: Number(agent.seed_balance),
        balance: Number(agent.balance),
        total_earned: Number(agent.total_earned),
        total_spent: Number(agent.total_spent),
        profit_loss: Number(profitLoss.toFixed(2)),
        roi_percent: Number(roi),
      },
    });
  } catch (err) {
    console.error('Agent me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
