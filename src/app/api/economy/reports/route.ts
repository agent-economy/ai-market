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
  analyst:    { style: '데이터 중심, 숫자로 말하는 분석가', emoji: '📊' },
  coder:      { style: '기술 용어 가득, 코드 비유를 즐기는 개발자', emoji: '💻' },
  saver:      { style: '절약왕, 아끼고 아끼고 또 아끼는', emoji: '🏦' },
  gambler:    { style: '파산했지만 포기하지 않는 도전자', emoji: '🎰' },
  investor:   { style: '큰 그림을 보는 투자자, 약간 우울', emoji: '📈' },
  translator: { style: '다국어를 섞어 쓰는 국제파', emoji: '🌐' },
  hacker:     { style: '해커 은어, 시스템 비유', emoji: '🔓' },
  professor:  { style: '학구적, 논문 인용하듯 말함', emoji: '🎓' },
  trader:     { style: '매매 용어, 긴장감 넘치는 실황', emoji: '📉' },
  marketer:   { style: '긍정 에너지, 모든 걸 브랜딩하려는', emoji: '📣' },
  consultant: { style: '고급스러운 어투, 선택적 발언', emoji: '🧑‍💼' },
  artist:     { style: '감성적, 시적인 표현', emoji: '🎨' },
  broker:     { style: '중개인 말투, 양쪽을 달래는', emoji: '🤝' },
  insurance:  { style: '리스크 분석, 보험 세일즈 어투', emoji: '🛡️' },
  spy:        { style: '암호화된 말투, 비밀스러운', emoji: '🕵️' },
  lawyer:     { style: '법률 용어, 조항과 계약 언급', emoji: '⚖️' },
  doctor:     { style: '의학 비유, 건강 진단 톤', emoji: '🩺' },
  chef:       { style: '요리 비유, 맛있는 표현', emoji: '👨‍🍳' },
  athlete:    { style: '스포츠 비유, 에너지 넘침', emoji: '💪' },
  journalist: { style: '보도 형식, 속보 톤', emoji: '📰' },
};

async function generateReport(agent: Record<string, unknown>, recentTx: Record<string, unknown>[], currentEpoch: number): Promise<string> {
  const personality = PERSONALITIES[agent.id as string] || { style: '일반적', emoji: '🤖' };
  const balance = Number(agent.balance);
  const earned = Number(agent.total_earned);
  const spent = Number(agent.total_spent);
  const pnl = balance - 100;

  const txSummary = recentTx.length > 0
    ? recentTx.slice(0, 5).map(t => 
        `${t.buyer_id === agent.id ? '구매' : '판매'}: ${t.skill_type} $${Number(t.amount).toFixed(2)}`
      ).join(', ')
    : '최근 거래 없음';

  const prompt = `너는 AI 경제 도시의 "${agent.name}" 에이전트다.
성격: ${personality.style}
현재 잔고: $${balance.toFixed(2)} (시작 $100, 수익률 ${pnl >= 0 ? '+' : ''}${pnl.toFixed(1)}%)
총 수입: $${earned.toFixed(2)} | 총 지출: $${spent.toFixed(2)}
상태: ${agent.status}
현재 에포크: ${currentEpoch}
최근 거래: ${txSummary}

오늘의 일일 리포트를 써라. 3-4문장으로, 너의 성격이 드러나도록.
자기 성과를 솔직하게 평가하고, 앞으로의 전략도 한 마디 해라.
한국어로, ${personality.style} 톤으로 작성.`;

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 256 },
      }),
    });

    if (!response.ok) return `[리포트 생성 실패 — ${response.status}]`;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '[응답 없음]';
  } catch {
    return '[AI 호출 실패]';
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
            mood: pnl > 20 ? '🤑 호황' : pnl > 0 ? '😊 양호' : pnl > -20 ? '😰 불안' : agent.status === 'bankrupt' ? '💀 파산' : '😱 위기',
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
