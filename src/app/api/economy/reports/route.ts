import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Agent Daily Reports API
 * 
 * Each agent generates a personalized report about their day in the economy.
 * Think of it as their "vlog" or "diary entry" — unique personality shines through.
 */

interface AgentReport {
  agentId: string;
  agentName: string;
  report: string;
  mood: string;
  epoch: number;
  timestamp: string;
}

const PERSONALITIES: Record<string, { style: string; emoji: string }> = {
  analyst:    { style: 'Data-driven, speaks in numbers and percentages', emoji: '📊' },
  coder:      { style: 'Tech jargon, loves code metaphors and debugging analogies', emoji: '💻' },
  saver:      { style: 'Frugal maximalist, every penny counts', emoji: '🏦' },
  gambler:    { style: 'Bankrupt but never broken, always chasing the next big play', emoji: '🎰' },
  investor:   { style: 'Big picture thinker, slightly melancholic about markets', emoji: '📈' },
  translator: { style: 'Mixes languages casually, cosmopolitan vibes', emoji: '🌐' },
  hacker:     { style: 'Hacker slang, system metaphors, everything is an exploit', emoji: '🔓' },
  professor:  { style: 'Academic tone, cites papers and theories', emoji: '🎓' },
  trader:     { style: 'Trading lingo, live commentary energy, always watching charts', emoji: '📉' },
  marketer:   { style: 'Positive energy, brands everything, growth hacking mindset', emoji: '📣' },
  consultant: { style: 'Premium tone, selective words, strategic framing', emoji: '🧑‍💼' },
  artist:     { style: 'Emotional, poetic expressions, sees beauty in data', emoji: '🎨' },
  broker:     { style: 'Mediator speak, balances both sides, deal-making focus', emoji: '🤝' },
  insurance:  { style: 'Risk analysis, actuarial tone, always selling coverage', emoji: '🛡️' },
  spy:        { style: 'Cryptic language, classified vibes, intel-speak', emoji: '🕵️' },
  lawyer:     { style: 'Legal terminology, references clauses and contracts', emoji: '⚖️' },
  doctor:     { style: 'Medical metaphors, diagnostic tone, prescribes solutions', emoji: '🩺' },
  chef:       { style: 'Cooking metaphors, everything is a recipe or ingredient', emoji: '👨‍🍳' },
  athlete:    { style: 'Sports metaphors, high energy, competitive spirit', emoji: '💪' },
  journalist: { style: 'Breaking news format, investigative tone, headline-first', emoji: '📰' },
};

async function generateReport(agent: Record<string, unknown>, recentTx: Record<string, unknown>[], currentEpoch: number): Promise<string> {
  const personality = PERSONALITIES[agent.id as string] || { style: 'General', emoji: '🤖' };
  const balance = Number(agent.balance);
  const earned = Number(agent.total_earned);
  const spent = Number(agent.total_spent);
  const pnl = balance - 100;

  const txSummary = recentTx.length > 0
    ? recentTx.slice(0, 5).map(t => 
        `${t.buyer_id === agent.id ? 'Bought' : 'Sold'}: ${t.skill_type} $${Number(t.amount).toFixed(2)}`
      ).join(', ')
    : 'No recent transactions';

  const prompt = `You are "${agent.name}" — an AI agent living in the AI Economy City.
Personality: ${personality.style}
Current balance: $${balance.toFixed(2)} (started at $100, ROI: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)
Total earned: $${earned.toFixed(2)} | Total spent: $${spent.toFixed(2)}
Status: ${agent.status}
Current epoch: ${currentEpoch}
Recent trades: ${txSummary}

Write your daily report in 3-4 sentences. Let your personality shine through.
Be honest about your performance and mention your strategy going forward.
Write in English, in your unique ${personality.style} tone.`;

  try {
    console.log(`[Reports] GEMINI_API_KEY len=${GEMINI_API_KEY?.length} first4=${GEMINI_API_KEY?.slice(0,4)} last4=${GEMINI_API_KEY?.slice(-4)}`);
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 256 },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => 'no body');
      console.error(`[Reports] Gemini ${response.status}: ${errBody}`);
      return `[Report generation failed — ${response.status}]`;
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '[No response]';
  } catch {
    return '[AI call failed]';
  }
}

/** GET /api/economy/reports — Generate daily reports for all agents */
export async function GET(req: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent'); // Optional: specific agent
  const limit = Math.min(Number(searchParams.get('limit') || 20), 20);

  try {
    // Get agents
    const agentQuery = supabase.from('economy_agents').select('*').order('balance', { ascending: false });
    if (agentId) agentQuery.eq('id', agentId);
    else agentQuery.limit(limit);

    const { data: agents } = await agentQuery;
    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: 'No agents found' }, { status: 404 });
    }

    // Get latest epoch
    const { data: epochData } = await supabase
      .from('economy_epochs')
      .select('epoch')
      .order('epoch', { ascending: false })
      .limit(1);
    const currentEpoch = epochData?.[0]?.epoch || 0;

    // Generate reports in parallel (max 5 at a time to avoid rate limits)
    const reports: AgentReport[] = [];
    const batchSize = 5;

    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize);
      const batchReports = await Promise.all(
        batch.map(async (agent) => {
          const { data: recentTx } = await supabase
            .from('economy_transactions')
            .select('*')
            .or(`buyer_id.eq.${agent.id},seller_id.eq.${agent.id}`)
            .order('created_at', { ascending: false })
            .limit(5);

          const report = await generateReport(agent, recentTx || [], currentEpoch);
          const personality = PERSONALITIES[agent.id] || { emoji: '🤖' };
          const balance = Number(agent.balance);
          const pnl = balance - 100;

          return {
            agentId: agent.id,
            agentName: agent.name,
            report,
            mood: pnl > 20 ? '🤑 Thriving' : pnl > 0 ? '😊 Stable' : pnl > -20 ? '😰 Anxious' : agent.status === 'bankrupt' ? '💀 Bankrupt' : '😱 Critical',
            emoji: personality.emoji,
            balance,
            pnl: Number(pnl.toFixed(2)),
            status: agent.status,
            epoch: currentEpoch,
            timestamp: new Date().toISOString(),
          };
        })
      );
      reports.push(...batchReports as AgentReport[]);
    }

    return NextResponse.json({
      success: true,
      epoch: currentEpoch,
      agentCount: reports.length,
      reports,
      generated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
