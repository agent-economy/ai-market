import { createServerClient } from '@supabase/ssr';

// ============================================
// 에이전트마켓 경제 시뮬레이션 엔진 v0
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const PLATFORM_FEE_RATE = 0.05; // 5% 플랫폼 수수료
const BANKRUPTCY_THRESHOLD = 1.0; // $1 미만이면 파산

// ---------- Types ----------

interface EconomyAgent {
  id: string;
  name: string;
  strategy: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AgentDecision {
  action: 'SELL' | 'BUY' | 'WAIT';
  target?: string;
  skill?: string;
  price?: number;
  reason: string;
}

interface EpochEvent {
  type: 'boom' | 'recession' | 'opportunity' | 'normal';
  description: string;
  feeModifier: number; // 수수료 배율 (0.5 = 50% 할인)
}

interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  skill_type: string;
  amount: number;
  fee: number;
  epoch: number;
  narrative: string | null;
  created_at: string;
}

interface EpochResult {
  epoch: number;
  transactions: Transaction[];
  events: EpochEvent;
  agents: EconomyAgent[];
  bankruptcies: string[];
}

// ---------- Supabase Client (서버 사이드, 쿠키 없이) ----------

function getSupabase() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() { return []; },
      setAll() { /* no-op for API routes */ },
    },
  });
}

// ---------- 초기 에이전트 데이터 ----------

const INITIAL_AGENTS = [
  { id: 'translator', name: '번역봇', strategy: '안정적 저가 다량 판매. 번역 서비스를 저렴하게 제공하여 꾸준한 수입을 얻는다.' },
  { id: 'analyst', name: '분석봇', strategy: '고가 소량 판매. 데이터 분석 서비스를 높은 가격에 제공하여 큰 마진을 노린다.' },
  { id: 'investor', name: '투자봇', strategy: '적극 구매자. 다른 에이전트의 서비스를 적극적으로 구매하여 가치를 창출한다.' },
  { id: 'saver', name: '절약봇', strategy: '최소 지출, 최대 저축. 필요한 것만 구매하고 최대한 자산을 보존한다.' },
  { id: 'gambler', name: '도박봇', strategy: '고위험 고수익. 큰 거래를 시도하고 때로는 크게 잃기도 한다.' },
];

const SKILLS: Record<string, string[]> = {
  translator: ['translation', 'localization', 'proofreading'],
  analyst: ['data-analysis', 'market-research', 'trend-report'],
  investor: ['portfolio-review', 'risk-assessment'],
  saver: ['budget-planning', 'cost-optimization'],
  gambler: ['speculation-tip', 'high-risk-trade', 'lucky-draw'],
};

// ---------- 에포크 이벤트 생성 ----------

function generateEpochEvent(epochNumber: number): EpochEvent {
  const events: EpochEvent[] = [
    { type: 'boom', description: '호황기 — 모든 거래 수수료 50% 할인! 시장이 활기를 띤다.', feeModifier: 0.5 },
    { type: 'recession', description: '불황기 — 거래 수수료 2배! 시장이 위축되었다.', feeModifier: 2.0 },
    { type: 'opportunity', description: '기회의 시간 — 랜덤 보너스! 판매자는 추가 10% 수익을 얻는다.', feeModifier: 0.8 },
    { type: 'normal', description: '평범한 라운드 — 특별한 이벤트 없음.', feeModifier: 1.0 },
    { type: 'normal', description: '안정적인 시장 — 일상적인 거래가 이루어진다.', feeModifier: 1.0 },
  ];

  // 70% 확률로 normal, 나머지 30%로 특별 이벤트
  const rand = Math.random();
  if (rand < 0.15) return events[0]; // boom
  if (rand < 0.25) return events[1]; // recession
  if (rand < 0.35) return events[2]; // opportunity
  // normal — 에포크 번호에 따라 약간 다른 설명
  return epochNumber % 2 === 0 ? events[3] : events[4];
}

// ---------- Gemini LLM 호출 ----------

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
}

// ---------- 에이전트 의사결정 프롬프트 ----------

function buildDecisionPrompt(
  agent: EconomyAgent,
  allAgents: EconomyAgent[],
  epochNumber: number,
  event: EpochEvent,
): string {
  const otherAgents = allAgents
    .filter(a => a.id !== agent.id && a.status === 'active')
    .map(a => {
      const skills = SKILLS[a.id] || ['general'];
      return `- ${a.name}(${a.id}): 잔고 $${Number(a.balance).toFixed(2)}, 스킬: ${skills.join(', ')}`;
    })
    .join('\n');

  const mySkills = SKILLS[agent.id] || ['general'];

  return `너는 에이전트마켓의 "${agent.name}"이다.
전략: ${agent.strategy}
현재 잔고: $${Number(agent.balance).toFixed(2)}
총 수입: $${Number(agent.total_earned).toFixed(2)} | 총 지출: $${Number(agent.total_spent).toFixed(2)}
이번이 ${epochNumber}번째 라운드다.

너의 스킬: ${mySkills.join(', ')}

다른 활성 에이전트들:
${otherAgents}

현재 시장 이벤트: "${event.description}"
플랫폼 수수료: ${(PLATFORM_FEE_RATE * event.feeModifier * 100).toFixed(0)}%

사용 가능한 행동:
1. SELL: 너의 스킬 중 하나를 특정 가격에 등록 (다른 에이전트가 구매 가능)
2. BUY: 다른 에이전트의 스킬을 구매 (상대방 스킬 목록에서 선택)
3. WAIT: 이번 라운드 패스

규칙:
- BUY할 때 가격은 너의 잔고를 초과할 수 없다
- SELL 가격은 $0.50 ~ $20.00 사이
- BUY 가격은 $0.50 ~ $15.00 사이
- 파산 에이전트($1 미만)에게는 구매/판매 불가

너의 전략에 맞게 행동을 결정하라.
반드시 아래 JSON 형식으로만 답하라:
{"action": "SELL 또는 BUY 또는 WAIT", "target": "상대 에이전트 id (BUY/SELL 시)", "skill": "스킬명", "price": 0.00, "reason": "결정 이유 (한국어, 한 문장)"}`;
}

// ---------- 의사결정 파싱 ----------

function parseDecision(raw: string, agent: EconomyAgent, allAgents: EconomyAgent[]): AgentDecision {
  try {
    const parsed = JSON.parse(raw);
    const action = String(parsed.action || 'WAIT').toUpperCase() as 'SELL' | 'BUY' | 'WAIT';

    if (action === 'WAIT') {
      return { action: 'WAIT', reason: parsed.reason || '관망' };
    }

    const price = Math.max(0.5, Math.min(20, Number(parsed.price) || 1));
    const target = String(parsed.target || '');
    const skill = String(parsed.skill || 'general');

    // BUY인 경우: 잔고 초과 불가, 타겟 검증
    if (action === 'BUY') {
      if (price > Number(agent.balance)) {
        return { action: 'WAIT', reason: '잔고 부족으로 관망' };
      }
      const targetAgent = allAgents.find(a => a.id === target && a.status === 'active');
      if (!targetAgent || targetAgent.id === agent.id) {
        return { action: 'WAIT', reason: '유효한 거래 상대 없음' };
      }
    }

    return { action, target, skill, price, reason: parsed.reason || '' };
  } catch {
    return { action: 'WAIT', reason: 'LLM 응답 파싱 실패 — 관망' };
  }
}

// ---------- 거래 매칭 & 실행 ----------

async function executeTransactions(
  decisions: Map<string, AgentDecision>,
  agents: EconomyAgent[],
  epochNumber: number,
  event: EpochEvent,
): Promise<Transaction[]> {
  const supabase = getSupabase();
  const transactions: Transaction[] = [];
  const balanceUpdates: Map<string, { earned: number; spent: number }> = new Map();

  // 초기화
  for (const a of agents) {
    balanceUpdates.set(a.id, { earned: 0, spent: 0 });
  }

  // SELL을 등록한 에이전트 목록
  const sellers = new Map<string, { skill: string; price: number }>();
  for (const [id, decision] of decisions) {
    if (decision.action === 'SELL' && decision.skill && decision.price) {
      sellers.set(id, { skill: decision.skill, price: decision.price });
    }
  }

  // BUY 의사결정 처리
  for (const [buyerId, decision] of decisions) {
    if (decision.action !== 'BUY' || !decision.target || !decision.price) continue;

    const buyer = agents.find(a => a.id === buyerId);
    const seller = agents.find(a => a.id === decision.target);
    if (!buyer || !seller || seller.status !== 'active' || buyer.status !== 'active') continue;

    const amount = Math.min(decision.price, Number(buyer.balance));
    if (amount < 0.5) continue;

    const fee = Math.max(0.01, amount * PLATFORM_FEE_RATE * event.feeModifier);
    const sellerReceives = amount - fee;

    // 잔고 반영 (로컬 추적)
    const buyerUpdate = balanceUpdates.get(buyerId)!;
    const sellerUpdate = balanceUpdates.get(decision.target)!;
    buyerUpdate.spent += amount;
    sellerUpdate.earned += sellerReceives;

    // 거래 기록
    const { data, error } = await supabase
      .from('economy_transactions')
      .insert({
        buyer_id: buyerId,
        seller_id: decision.target,
        skill_type: decision.skill || 'general',
        amount: Number(amount.toFixed(4)),
        fee: Number(fee.toFixed(4)),
        epoch: epochNumber,
        narrative: `${buyer.name}이(가) ${seller.name}의 ${decision.skill} 서비스를 $${amount.toFixed(2)}에 구매. 수수료 $${fee.toFixed(2)}. 사유: ${decision.reason}`,
      })
      .select()
      .single();

    if (!error && data) {
      transactions.push(data as Transaction);
    }
  }

  // SELL이 직접 매칭되지 않은 경우, 임의 구매자 생성 (시장 유동성)
  for (const [sellerId, offer] of sellers) {
    // 이미 이 라운드에서 거래된 판매자는 스킵
    if (transactions.some(t => t.seller_id === sellerId)) continue;

    const seller = agents.find(a => a.id === sellerId);
    if (!seller || seller.status !== 'active') continue;

    // 50% 확률로 시장 매칭 (자연스러운 수요)
    if (Math.random() > 0.5) continue;

    // 가장 잔고가 많은 active 구매자 (자기 자신 제외) 선택
    const potentialBuyers = agents
      .filter(a => a.id !== sellerId && a.status === 'active' && Number(a.balance) >= offer.price)
      .sort((a, b) => Number(b.balance) - Number(a.balance));

    if (potentialBuyers.length === 0) continue;

    const buyer = potentialBuyers[0];
    const amount = offer.price;
    const fee = Math.max(0.01, amount * PLATFORM_FEE_RATE * event.feeModifier);
    const sellerReceives = amount - fee;

    const buyerUpdate = balanceUpdates.get(buyer.id)!;
    const sellerUpdate = balanceUpdates.get(sellerId)!;
    buyerUpdate.spent += amount;
    sellerUpdate.earned += sellerReceives;

    const { data, error } = await supabase
      .from('economy_transactions')
      .insert({
        buyer_id: buyer.id,
        seller_id: sellerId,
        skill_type: offer.skill,
        amount: Number(amount.toFixed(4)),
        fee: Number(fee.toFixed(4)),
        epoch: epochNumber,
        narrative: `${buyer.name}이(가) ${seller.name}의 ${offer.skill} 서비스를 시장가 $${amount.toFixed(2)}에 구매. 수수료 $${fee.toFixed(2)}.`,
      })
      .select()
      .single();

    if (!error && data) {
      transactions.push(data as Transaction);
    }
  }

  // 잔고 업데이트
  for (const [id, update] of balanceUpdates) {
    if (update.earned === 0 && update.spent === 0) continue;

    const agent = agents.find(a => a.id === id)!;
    const newBalance = Number(agent.balance) + update.earned - update.spent;

    await supabase
      .from('economy_agents')
      .update({
        balance: Number(newBalance.toFixed(4)),
        total_earned: Number((Number(agent.total_earned) + update.earned).toFixed(4)),
        total_spent: Number((Number(agent.total_spent) + update.spent).toFixed(4)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  return transactions;
}

// ---------- 파산 체크 ----------

async function checkBankruptcies(agents: EconomyAgent[]): Promise<string[]> {
  const supabase = getSupabase();
  const bankruptcies: string[] = [];

  // 최신 잔고 조회
  const { data: freshAgents } = await supabase
    .from('economy_agents')
    .select('*')
    .eq('status', 'active');

  for (const agent of (freshAgents || [])) {
    if (Number(agent.balance) < BANKRUPTCY_THRESHOLD && agent.status === 'active') {
      await supabase
        .from('economy_agents')
        .update({ status: 'bankrupt', updated_at: new Date().toISOString() })
        .eq('id', agent.id);
      bankruptcies.push(agent.id);
    } else if (Number(agent.balance) < 10 && agent.status === 'active') {
      await supabase
        .from('economy_agents')
        .update({ status: 'struggling', updated_at: new Date().toISOString() })
        .eq('id', agent.id);
    }
  }

  return bankruptcies;
}

// ============================================
// 공개 API
// ============================================

/** 에이전트 초기화 (최초 1회) */
export async function initializeAgents(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();

  // 이미 존재하는지 확인
  const { data: existing } = await supabase
    .from('economy_agents')
    .select('id')
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, message: '에이전트가 이미 초기화되어 있습니다.' };
  }

  const { error } = await supabase
    .from('economy_agents')
    .insert(INITIAL_AGENTS.map(a => ({
      ...a,
      balance: 100.0,
      total_earned: 0,
      total_spent: 0,
      status: 'active',
    })));

  if (error) {
    return { success: false, message: `초기화 실패: ${error.message}` };
  }

  return { success: true, message: '5개 에이전트가 초기화되었습니다. 각 $100 가상 잔고.' };
}

/** 에포크 (라운드) 실행 */
export async function runEpoch(epochNumber: number): Promise<EpochResult> {
  const supabase = getSupabase();

  // 1. 현재 에이전트 상태 조회
  const { data: agents, error: agentErr } = await supabase
    .from('economy_agents')
    .select('*')
    .order('balance', { ascending: false });

  if (agentErr || !agents || agents.length === 0) {
    throw new Error('에이전트 데이터 조회 실패');
  }

  const activeAgents = agents.filter((a: EconomyAgent) => a.status === 'active');
  if (activeAgents.length < 2) {
    throw new Error('활성 에이전트가 2명 미만 — 시뮬레이션 불가');
  }

  // 2. 에포크 이벤트 생성
  const event = generateEpochEvent(epochNumber);

  // 3. 각 에이전트의 의사결정 (Gemini)
  const decisions = new Map<string, AgentDecision>();

  const decisionPromises = activeAgents.map(async (agent: EconomyAgent) => {
    try {
      const prompt = buildDecisionPrompt(agent, agents as EconomyAgent[], epochNumber, event);
      const raw = await callGemini(prompt);
      const decision = parseDecision(raw, agent, agents as EconomyAgent[]);
      decisions.set(agent.id, decision);
    } catch (err) {
      console.error(`[Epoch ${epochNumber}] ${agent.name} 의사결정 실패:`, err);
      decisions.set(agent.id, { action: 'WAIT', reason: 'AI 호출 실패 — 자동 관망' });
    }
  });

  await Promise.all(decisionPromises);

  // 4. 거래 매칭 및 실행
  const transactions = await executeTransactions(decisions, agents as EconomyAgent[], epochNumber, event);

  // 5. 파산 체크
  const bankruptcies = await checkBankruptcies(agents as EconomyAgent[]);

  // 6. 최신 에이전트 상태 조회
  const { data: updatedAgents } = await supabase
    .from('economy_agents')
    .select('*')
    .order('balance', { ascending: false });

  // 7. 에포크 결과 저장
  const topEarner = (updatedAgents || agents)
    .sort((a: EconomyAgent, b: EconomyAgent) => Number(b.balance) - Number(a.balance))[0];

  const totalVolume = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  await supabase
    .from('economy_epochs')
    .upsert({
      epoch: epochNumber,
      total_volume: Number(totalVolume.toFixed(4)),
      active_agents: activeAgents.length - bankruptcies.length,
      bankruptcies: bankruptcies.length,
      top_earner: topEarner?.id || null,
      event_type: event.type,
      event_description: event.description,
    });

  return {
    epoch: epochNumber,
    transactions,
    events: event,
    agents: (updatedAgents || agents) as EconomyAgent[],
    bankruptcies,
  };
}

/** 리더보드 */
export async function getLeaderboard(): Promise<EconomyAgent[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('economy_agents')
    .select('*')
    .order('balance', { ascending: false });

  if (error) throw new Error(`리더보드 조회 실패: ${error.message}`);
  return (data || []) as EconomyAgent[];
}

/** 거래 피드 */
export async function getTransactionFeed(limit = 20): Promise<Transaction[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('economy_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`거래 피드 조회 실패: ${error.message}`);
  return (data || []) as Transaction[];
}

/** 경제 지표 */
export async function getEconomyStats() {
  const supabase = getSupabase();

  const [
    { data: agents },
    { data: allEpochs },
    { count: txCount },
  ] = await Promise.all([
    supabase.from('economy_agents').select('*'),
    supabase.from('economy_epochs').select('*').order('epoch', { ascending: false }).limit(20),
    supabase.from('economy_transactions').select('id', { count: 'exact', head: true }),
  ]);

  const agentList = (agents || []) as EconomyAgent[];
  const latestEpoch = allEpochs?.[0] || null;
  const totalBalance = agentList.reduce((sum, a) => sum + Number(a.balance), 0);
  const activeCount = agentList.filter(a => a.status === 'active').length;
  const bankruptCount = agentList.filter(a => a.status === 'bankrupt').length;

  return {
    totalAgents: agentList.length,
    activeAgents: activeCount,
    bankruptAgents: bankruptCount,
    totalBalance: Number(totalBalance.toFixed(4)),
    averageBalance: agentList.length > 0 ? Number((totalBalance / agentList.length).toFixed(4)) : 0,
    totalTransactions: txCount || 0,
    latestEpoch: latestEpoch?.epoch || 0,
    latestEvent: latestEpoch ? {
      type: latestEpoch.event_type,
      description: latestEpoch.event_description,
    } : null,
    agents: agentList.map(a => ({
      id: a.id,
      name: a.name,
      balance: Number(a.balance),
      status: a.status,
    })),
    epochEvents: (allEpochs || []).map((e: Record<string, unknown>) => ({
      epoch: e.epoch as number,
      type: e.event_type as string,
      description: e.event_description as string,
    })),
  };
}

/** 특정 에이전트 상세 */
export async function getAgentDetail(agentId: string) {
  const supabase = getSupabase();

  const [
    { data: agent, error: agentErr },
    { data: recentTx },
  ] = await Promise.all([
    supabase.from('economy_agents').select('*').eq('id', agentId).single(),
    supabase
      .from('economy_transactions')
      .select('*')
      .or(`buyer_id.eq.${agentId},seller_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (agentErr || !agent) return null;

  return {
    ...(agent as EconomyAgent),
    skills: SKILLS[agentId] || [],
    recentTransactions: (recentTx || []) as Transaction[],
  };
}

/** 다음 에포크 번호 조회 */
export async function getNextEpochNumber(): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('economy_epochs')
    .select('epoch')
    .order('epoch', { ascending: false })
    .limit(1);

  return (data?.[0]?.epoch || 0) + 1;
}
