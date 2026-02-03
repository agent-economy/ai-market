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
];

const MARKET_EVENTS = [
  { type: 'boom', description: '🚀 경기 호황! 거래량 급증', priceMultiplier: 1.5, tradeProbability: 0.8 },
  { type: 'recession', description: '📉 경기 침체... 소비 위축', priceMultiplier: 0.6, tradeProbability: 0.3 },
  { type: 'opportunity', description: '⚡ 특별 기회 발생! 고수익 가능', priceMultiplier: 2.0, tradeProbability: 0.6 },
  { type: 'normal', description: '📊 평범한 시장 상황', priceMultiplier: 1.0, tradeProbability: 0.5 },
];

async function getAgentDecision(agent, marketEvent, agents) {
  const otherAgents = agents.filter(a => a.id !== agent.id && a.status === 'active');
  const prompt = `You are an AI economic agent named "${agent.name}".
Your strategy: ${agent.strategy}
Your current balance: $${agent.balance} USDC
Market condition: ${marketEvent.description}

Other active agents and their balances:
${otherAgents.map(a => `- ${a.name}: $${a.balance}`).join('\n')}

Available skills to trade:
${SKILLS.map(s => `- ${s.name}: base price $${s.basePrice}`).join('\n')}

Current market price multiplier: ${marketEvent.priceMultiplier}x

Decide your action. Respond ONLY with valid JSON:
{"action":"SELL"|"BUY"|"WAIT","skill":"${SKILLS.map(s=>s.type).join('|')}","price":number,"target":"agent_id","reason":"brief reason"}

Rules:
- SELL: You offer a skill. Price = your asking price.
- BUY: You want to buy a skill from target agent. Price = max you'll pay.
- WAIT: Do nothing this round.
- You cannot spend more than your balance.
- Be strategic based on your personality.`;

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

  // Also create random trades based on market probability
  if (transactions.length === 0 && Math.random() < event.tradeProbability) {
    const a1 = agents[Math.floor(Math.random() * agents.length)];
    let a2 = agents[Math.floor(Math.random() * agents.length)];
    while (a2.id === a1.id) a2 = agents[Math.floor(Math.random() * agents.length)];
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

  // Check bankruptcies
  const { data: updatedAgents } = await supabase
    .from('economy_agents')
    .select('*')
    .order('balance', { ascending: false });

  let bankruptcies = 0;
  for (const agent of updatedAgents) {
    if (agent.balance < BANKRUPTCY_THRESHOLD && agent.status === 'active') {
      await supabase.from('economy_agents')
        .update({ status: 'bankrupt', updated_at: new Date().toISOString() })
        .eq('id', agent.id);
      bankruptcies++;
      console.log(`  💀 파산! ${agent.name} ($${agent.balance})`);
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
    const emoji = a.status === 'bankrupt' ? '💀' : ['🥇','🥈','🥉','4️⃣','5️⃣'][i];
    console.log(`  ${emoji} ${a.name}: $${parseFloat(a.balance).toFixed(2)} (${a.status})`);
  });

  return { epoch: epochNum, transactions: transactions.length, volume: totalVolume };
}

// Run 3 epochs
async function main() {
  console.log('🏙️ AI 경제 시뮬레이션 시작!\n');
  
  for (let i = 0; i < 3; i++) {
    await runEpoch();
    if (i < 2) {
      console.log('\n⏳ 다음 에포크 준비 중...\n');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log('\n✅ 시뮬레이션 완료!');
}

main().catch(console.error);
