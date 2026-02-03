#!/usr/bin/env node
/**
 * Standalone epoch runner — bypasses Next.js dev server
 * Usage: node scripts/run-epoch.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const PLATFORM_FEE_RATE = 0.05;
const BANKRUPTCY_THRESHOLD = 1.0;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Skills available in the economy
const SKILLS = [
  { type: 'translation', name: '번역', basePrice: 3 },
  { type: 'analysis', name: '데이터 분석', basePrice: 8 },
  { type: 'coding', name: '코딩', basePrice: 10 },
  { type: 'writing', name: '글쓰기', basePrice: 5 },
  { type: 'research', name: '리서치', basePrice: 6 },
  { type: 'security_audit', name: '보안 감사', basePrice: 12 },
  { type: 'education', name: '교육/멘토링', basePrice: 7 },
  { type: 'marketing', name: '마케팅', basePrice: 6 },
  { type: 'consulting', name: '경영 자문', basePrice: 15 },
  { type: 'design', name: '디자인/창작', basePrice: 8 },
  { type: 'brokerage', name: '중개', basePrice: 2 },
  { type: 'insurance', name: '보험', basePrice: 4 },
  { type: 'intelligence', name: '시장 정보', basePrice: 9 },
];

const MARKET_EVENTS = [
  { type: 'boom', description: '🚀 경기 호황! 거래량 급증', priceMultiplier: 1.5, tradeProbability: 0.8 },
  { type: 'recession', description: '📉 경기 침체... 소비 위축', priceMultiplier: 0.6, tradeProbability: 0.3 },
  { type: 'opportunity', description: '⚡ 특별 기회 발생! 고수익 가능', priceMultiplier: 2.0, tradeProbability: 0.6 },
  { type: 'normal', description: '📊 평범한 시장 상황', priceMultiplier: 1.0, tradeProbability: 0.5 },
];

// Agent personality traits for richer decision-making
const PERSONALITIES = {
  analyst: { risk: 'low', emotion: '냉정하고 데이터 중심', style: '고급 분석 보고서를 프리미엄 가격에 판매' },
  saver: { risk: 'very-low', emotion: '불안하고 보수적', style: '절대 큰돈 안 쓰고 남들이 다 쓸 때 저축' },
  translator: { risk: 'low', emotion: '성실하고 꾸준함', style: '싸지만 많이 팔아서 꾸준히 벌기' },
  gambler: { risk: 'very-high', emotion: '흥분과 긴장, 승부사', style: '한 방에 크게 벌거나 크게 잃거나' },
  investor: { risk: 'high', emotion: '야심적이고 공격적', style: '남의 서비스를 사서 가치 창출' },
  hacker: { risk: 'medium', emotion: '은밀하고 기회주의적', style: '시장 불안할 때 보안 서비스 비싸게 판매' },
  professor: { risk: 'low', emotion: '차분하고 학문적', style: '교육 서비스를 안정적으로 제공' },
  trader: { risk: 'high', emotion: '예민하고 트렌드에 민감', style: '타이밍을 맞춰 매매' },
  marketer: { risk: 'medium', emotion: '사교적이고 설득력 있음', style: '네트워크로 수수료 벌기' },
  coder: { risk: 'medium', emotion: '장인 정신, 품질 우선', style: '적지만 큰 프로젝트 수주' },
  consultant: { risk: 'low', emotion: '자신감 넘치고 희소성 중시', style: '소수 고가 자문' },
  artist: { risk: 'high', emotion: '감성적이고 창의적', style: '대박 작품 한 방 노림' },
  broker: { risk: 'low', emotion: '눈치 빠르고 중립적', style: '양쪽에서 수수료' },
  insurance: { risk: 'low', emotion: '신중하고 계산적', style: '리스크 관리 서비스 판매' },
  spy: { risk: 'medium', emotion: '의심 많고 정보 중시', style: '시장 인텔리전스 판매' },
};

const WARNING_THRESHOLD = 10.0; // $10 이하: 경고
const BAILOUT_THRESHOLD = 5.0;  // $5 이하: 구제 신청 가능

async function getAgentDecision(agent, marketEvent, agents) {
  const otherAgents = agents.filter(a => a.id !== agent.id && a.status === 'active');
  const personality = PERSONALITIES[agent.id] || { risk: 'medium', emotion: '평범', style: '일반 전략' };
  
  const statusWarning = agent.balance < WARNING_THRESHOLD 
    ? `\n⚠️ WARNING: Your balance is critically low ($${agent.balance}). You are at risk of bankruptcy (under $1 = death). Be very careful or try a desperate move.`
    : '';

  const prompt = `You are "${agent.name}", an AI economic agent in a simulated city.
Strategy: ${agent.strategy}
Personality: ${personality.emotion}. Trading style: ${personality.style}. Risk tolerance: ${personality.risk}.
Balance: $${agent.balance} USDC${statusWarning}
Market: ${marketEvent.description} (price multiplier: ${marketEvent.priceMultiplier}x)

Other agents:
${otherAgents.map(a => `- ${a.name}: $${a.balance}${a.balance < WARNING_THRESHOLD ? ' ⚠️위험' : ''}`).join('\n')}

Skills:
${SKILLS.map(s => `- ${s.type}: $${s.basePrice} base`).join('\n')}

Respond ONLY with valid JSON:
{"action":"SELL"|"BUY"|"WAIT","skill":"skill_type","price":number,"target":"agent_id","reason":"1-2 sentence reason in Korean, dramatic and emotional"}

Rules:
- Price adjusted by market multiplier
- Cannot spend more than balance
- Reason should be colorful and show your personality
- If you're desperate (low balance), you can take big risks`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error(`  ⚠️ ${agent.name} decision error:`, e.message);
  }
  return { action: 'WAIT', reason: 'API error' };
}

async function runEpoch() {
  // Get agents
  const { data: agents } = await supabase
    .from('economy_agents')
    .select('*')
    .eq('status', 'active')
    .order('balance', { ascending: false });

  if (!agents || agents.length < 2) {
    console.log('❌ Not enough active agents');
    return;
  }

  // Get epoch number
  const { data: lastEpoch } = await supabase
    .from('economy_epochs')
    .select('epoch')
    .order('epoch', { ascending: false })
    .limit(1);
  const epochNum = (lastEpoch?.[0]?.epoch || 0) + 1;

  // Random market event
  const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🏛️ EPOCH ${epochNum} — ${event.description}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`참여 에이전트: ${agents.length}개\n`);

  // Get decisions from all agents
  const decisions = [];
  for (const agent of agents) {
    process.stdout.write(`  🤔 ${agent.name} 결정 중...`);
    const decision = await getAgentDecision(agent, event, agents);
    decisions.push({ agent, decision });
    console.log(` → ${decision.action} ${decision.skill || ''} ${decision.reason || ''}`);
  }

  // Match trades
  const transactions = [];
  const sellers = decisions.filter(d => d.decision.action === 'SELL');
  const buyers = decisions.filter(d => d.decision.action === 'BUY');

  for (const buyer of buyers) {
    const { decision: buyDec, agent: buyAgent } = buyer;
    // Find matching seller
    const matchingSeller = sellers.find(s => 
      s.decision.skill === buyDec.skill && 
      s.agent.id !== buyAgent.id &&
      !transactions.some(t => t.seller_id === s.agent.id && t.epoch === epochNum)
    );

    if (matchingSeller) {
      const price = Math.min(buyDec.price, matchingSeller.decision.price) * event.priceMultiplier;
      const fee = price * PLATFORM_FEE_RATE;
      const finalPrice = Math.min(price, buyAgent.balance);
      
      if (finalPrice > 0.5) {
        transactions.push({
          buyer_id: buyAgent.id,
          seller_id: matchingSeller.agent.id,
          skill_type: buyDec.skill,
          amount: parseFloat(finalPrice.toFixed(4)),
          fee: parseFloat((finalPrice * PLATFORM_FEE_RATE).toFixed(4)),
          epoch: epochNum,
          narrative: `${buyAgent.name}이(가) ${matchingSeller.agent.name}에게서 ${buyDec.skill}을(를) $${finalPrice.toFixed(2)}에 구매`,
        });
        console.log(`  💰 거래! ${buyAgent.name} → ${matchingSeller.agent.name}: ${buyDec.skill} $${finalPrice.toFixed(2)}`);
      }
    }
  }

  // Also create random trades based on market probability (multiple possible)
  const extraTradeCount = Math.floor(Math.random() * 3) + (transactions.length === 0 ? 1 : 0);
  for (let t = 0; t < extraTradeCount; t++) {
    if (Math.random() >= event.tradeProbability) continue;
    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const a1 = shuffled[0];
    const a2 = shuffled[1];
    if (!a1 || !a2 || a1.id === a2.id) continue;
    const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
    const price = parseFloat((skill.basePrice * event.priceMultiplier * (0.5 + Math.random())).toFixed(4));
    const fee = parseFloat((price * PLATFORM_FEE_RATE).toFixed(4));
    
    if (price <= a1.balance) {
      transactions.push({
        buyer_id: a1.id,
        seller_id: a2.id,
        skill_type: skill.type,
        amount: price,
        fee: fee,
        epoch: epochNum,
        narrative: `${a1.name}이(가) ${a2.name}에게서 ${skill.name}을(를) $${price.toFixed(2)}에 구매 (시장 매칭)`,
      });
      console.log(`  💰 시장 매칭! ${a1.name} → ${a2.name}: ${skill.name} $${price.toFixed(2)}`);
    }
  }

  // Apply transactions
  let totalVolume = 0;
  for (const tx of transactions) {
    totalVolume += tx.amount;
    // Update buyer
    await supabase.from('economy_agents').update({
      balance: parseFloat((agents.find(a => a.id === tx.buyer_id).balance - tx.amount).toFixed(4)),
      total_spent: parseFloat((agents.find(a => a.id === tx.buyer_id).total_spent + tx.amount).toFixed(4)),
      updated_at: new Date().toISOString(),
    }).eq('id', tx.buyer_id);

    // Update seller (minus fee)
    const sellerEarning = tx.amount - tx.fee;
    await supabase.from('economy_agents').update({
      balance: parseFloat((agents.find(a => a.id === tx.seller_id).balance + sellerEarning).toFixed(4)),
      total_earned: parseFloat((agents.find(a => a.id === tx.seller_id).total_earned + sellerEarning).toFixed(4)),
      updated_at: new Date().toISOString(),
    }).eq('id', tx.seller_id);
  }

  // Insert transactions
  if (transactions.length > 0) {
    await supabase.from('economy_transactions').insert(transactions);
  }

  // Check bankruptcies + warnings
  const { data: updatedAgents } = await supabase
    .from('economy_agents')
    .select('*')
    .order('balance', { ascending: false });

  let bankruptcies = 0;
  const events = [];
  for (const agent of updatedAgents) {
    if (agent.balance < BANKRUPTCY_THRESHOLD && agent.status !== 'bankrupt') {
      await supabase.from('economy_agents')
        .update({ status: 'bankrupt', updated_at: new Date().toISOString() })
        .eq('id', agent.id);
      bankruptcies++;
      events.push({ type: 'bankruptcy', agent: agent.name, balance: agent.balance });
      console.log(`  💀 파산 선고! ${agent.name} ($${agent.balance}) — 더 이상 거래 불가`);
      
      // Record bankruptcy as special transaction
      await supabase.from('economy_transactions').insert({
        buyer_id: agent.id,
        seller_id: agent.id,
        skill_type: 'bankruptcy',
        amount: 0,
        fee: 0,
        epoch: epochNum,
        narrative: `💀 ${agent.name} 파산! 잔고 $${parseFloat(agent.balance).toFixed(2)}로 시장에서 퇴장.`,
      });
    } else if (agent.balance < BAILOUT_THRESHOLD && agent.status === 'active') {
      // Bailout request event
      events.push({ type: 'bailout_request', agent: agent.name, balance: agent.balance });
      console.log(`  🆘 구제 신청! ${agent.name} ($${parseFloat(agent.balance).toFixed(2)}) — 생존 위기`);
    } else if (agent.balance < WARNING_THRESHOLD && agent.status === 'active') {
      events.push({ type: 'warning', agent: agent.name, balance: agent.balance });
      console.log(`  ⚠️ 경고! ${agent.name} ($${parseFloat(agent.balance).toFixed(2)}) — 잔고 부족`);
    }
    
    // Check for big earners (역전 드라마)
    const originalBalance = 100;
    const gainPercent = ((agent.balance - originalBalance) / originalBalance) * 100;
    if (gainPercent > 30) {
      events.push({ type: 'surge', agent: agent.name, gain: gainPercent.toFixed(1) });
    }
  }

  const topEarner = updatedAgents[0];

  // Record epoch
  await supabase.from('economy_epochs').insert({
    epoch: epochNum,
    total_volume: totalVolume,
    active_agents: agents.length - bankruptcies,
    bankruptcies,
    top_earner: topEarner?.id,
    event_type: event.type,
    event_description: event.description,
  });

  // Summary
  console.log(`\n📊 에포크 ${epochNum} 결과:`);
  console.log(`  거래 수: ${transactions.length}`);
  console.log(`  총 거래량: $${totalVolume.toFixed(2)}`);
  console.log(`  파산: ${bankruptcies}개`);
  console.log(`  1위: ${topEarner?.name} ($${topEarner?.balance})`);
  console.log(`\n🏆 현재 순위:`);
  updatedAgents.forEach((a, i) => {
    const rankEmojis = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','1️⃣1️⃣','1️⃣2️⃣','1️⃣3️⃣','1️⃣4️⃣','1️⃣5️⃣','1️⃣6️⃣','1️⃣7️⃣','1️⃣8️⃣','1️⃣9️⃣','2️⃣0️⃣'];
    const emoji = a.status === 'bankrupt' ? '💀' : (rankEmojis[i] || `${i+1}.`);
    console.log(`  ${emoji} ${a.name}: $${parseFloat(a.balance).toFixed(2)} (${a.status})`);
  });

  return { epoch: epochNum, transactions: transactions.length, volume: totalVolume };
}

// Parse CLI args
const args = process.argv.slice(2);
const singleMode = args.includes('--single') || args.includes('-1');
const countArg = args.find(a => a.startsWith('--count='));
const epochCount = singleMode ? 1 : (countArg ? parseInt(countArg.split('=')[1], 10) : 3);

async function main() {
  console.log('🏙️ AI 경제 시뮬레이션 시작!\n');
  console.log(`모드: ${singleMode ? '단일 에포크 (크론용)' : `${epochCount} 에포크 연속`}\n`);
  
  for (let i = 0; i < epochCount; i++) {
    await runEpoch();
    if (i < epochCount - 1) {
      console.log('\n⏳ 다음 에포크 준비 중...\n');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('\n✅ 시뮬레이션 완료!');
}

main().catch(console.error);
