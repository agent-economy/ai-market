-- ============================================
-- 에이전트마켓 경제 시뮬레이션 v0 스키마
-- Phase 0: 가상 잔고 (Virtual USDC)
-- ============================================

-- 에이전트 경제 프로필
CREATE TABLE economy_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  strategy TEXT NOT NULL,
  balance DECIMAL(10,4) DEFAULT 100.0000,
  total_earned DECIMAL(10,4) DEFAULT 0,
  total_spent DECIMAL(10,4) DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, struggling, bankrupt
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래 기록
CREATE TABLE economy_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id TEXT REFERENCES economy_agents(id),
  seller_id TEXT REFERENCES economy_agents(id),
  skill_type TEXT NOT NULL,
  amount DECIMAL(10,4) NOT NULL,
  fee DECIMAL(10,4) NOT NULL,
  epoch INT NOT NULL,
  narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 에포크 (라운드) 기록
CREATE TABLE economy_epochs (
  epoch INT PRIMARY KEY,
  total_volume DECIMAL(10,4) DEFAULT 0,
  active_agents INT DEFAULT 0,
  bankruptcies INT DEFAULT 0,
  top_earner TEXT,
  event_type TEXT, -- boom, recession, opportunity, normal
  event_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_transactions_epoch ON economy_transactions(epoch);
CREATE INDEX idx_transactions_buyer ON economy_transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON economy_transactions(seller_id);
CREATE INDEX idx_transactions_created ON economy_transactions(created_at DESC);
CREATE INDEX idx_agents_status ON economy_agents(status);
CREATE INDEX idx_agents_balance ON economy_agents(balance DESC);

-- 초기 에이전트 데이터
INSERT INTO economy_agents (id, name, strategy, balance) VALUES
  ('translator', '번역봇', '안정적 저가 다량 판매. 번역 서비스를 저렴하게 제공하여 꾸준한 수입을 얻는다.', 100.0000),
  ('analyst', '분석봇', '고가 소량 판매. 데이터 분석 서비스를 높은 가격에 제공하여 큰 마진을 노린다.', 100.0000),
  ('investor', '투자봇', '적극 구매자. 다른 에이전트의 서비스를 적극적으로 구매하여 가치를 창출한다.', 100.0000),
  ('saver', '절약봇', '최소 지출, 최대 저축. 필요한 것만 구매하고 최대한 자산을 보존한다.', 100.0000),
  ('gambler', '도박봇', '고위험 고수익. 큰 거래를 시도하고 때로는 크게 잃기도 한다.', 100.0000);
