-- 편집 횟수 추적 테이블
-- Run this in Supabase SQL Editor

-- 1. 사용자별 월간 편집 횟수 테이블
CREATE TABLE IF NOT EXISTS edit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  month TEXT NOT NULL, -- 'YYYY-MM' format
  edit_count INTEGER DEFAULT 0,
  last_edit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, slug, month)
);

-- 2. 익명 사용자용 (IP/세션 기반)
CREATE TABLE IF NOT EXISTS anonymous_edit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, -- Client-generated session ID
  slug TEXT NOT NULL,
  month TEXT NOT NULL,
  edit_count INTEGER DEFAULT 0,
  last_edit_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, slug, month)
);

-- 3. 구독 플랜별 편집 제한
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- KRW
  edit_limit INTEGER NOT NULL, -- -1 = unlimited
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 기본 플랜 데이터 삽입
INSERT INTO subscription_plans (id, name, price_monthly, edit_limit, features) VALUES
  ('free', '무료', 0, 5, '["기본 편집", "워터마크 포함", "agentmarket.kr 서브도메인"]'),
  ('basic', '베이직', 2900, 20, '["워터마크 제거", "편집 20회/월"]'),
  ('pro', '프로', 9900, 100, '["커스텀 도메인", "편집 100회/월", "방문자 분석"]'),
  ('unlimited', '무제한', 19900, -1, '["무제한 편집", "AI 자동 업데이트", "우선 지원"]')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  edit_limit = EXCLUDED.edit_limit,
  features = EXCLUDED.features;

-- 5. 사용자 구독 테이블
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_id TEXT REFERENCES subscription_plans(id) DEFAULT 'free',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 인덱스
CREATE INDEX IF NOT EXISTS idx_edit_usage_user_month ON edit_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_edit_usage_slug ON edit_usage(slug);
CREATE INDEX IF NOT EXISTS idx_anonymous_edit_session ON anonymous_edit_usage(session_id, month);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);

-- 7. RLS 정책 (Row Level Security)
ALTER TABLE edit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_edit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own edit usage" ON edit_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own edit usage" ON edit_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own edit usage" ON edit_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- 익명 사용자는 서비스 역할로만 접근
CREATE POLICY "Service role can manage anonymous usage" ON anonymous_edit_usage
  FOR ALL USING (true);

-- 구독 정보
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 플랜 정보는 누구나 조회 가능
CREATE POLICY "Anyone can view plans" ON subscription_plans
  FOR SELECT USING (true);

-- 8. 편집 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_edit_count(
  p_user_id UUID,
  p_slug TEXT
) RETURNS TABLE(current_count INTEGER, limit_count INTEGER, can_edit BOOLEAN) AS $$
DECLARE
  v_month TEXT;
  v_plan_id TEXT;
  v_limit INTEGER;
  v_count INTEGER;
BEGIN
  v_month := to_char(NOW(), 'YYYY-MM');
  
  -- 사용자 플랜 조회
  SELECT COALESCE(us.plan_id, 'free') INTO v_plan_id
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id AND us.status = 'active';
  
  IF v_plan_id IS NULL THEN
    v_plan_id := 'free';
  END IF;
  
  -- 플랜 제한 조회
  SELECT edit_limit INTO v_limit FROM subscription_plans WHERE id = v_plan_id;
  
  -- 현재 사용량 조회 및 증가
  INSERT INTO edit_usage (user_id, slug, month, edit_count)
  VALUES (p_user_id, p_slug, v_month, 1)
  ON CONFLICT (user_id, slug, month) 
  DO UPDATE SET 
    edit_count = edit_usage.edit_count + 1,
    last_edit_at = NOW()
  RETURNING edit_count INTO v_count;
  
  RETURN QUERY SELECT 
    v_count,
    v_limit,
    (v_limit = -1 OR v_count <= v_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 월간 사용량 조회 함수
CREATE OR REPLACE FUNCTION get_monthly_usage(p_user_id UUID)
RETURNS TABLE(total_edits INTEGER, edit_limit INTEGER, plan_name TEXT) AS $$
DECLARE
  v_month TEXT;
BEGIN
  v_month := to_char(NOW(), 'YYYY-MM');
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(eu.edit_count)::INTEGER, 0) as total_edits,
    sp.edit_limit,
    sp.name as plan_name
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.user_id = p_user_id
  LEFT JOIN edit_usage eu ON eu.user_id = p_user_id AND eu.month = v_month
  WHERE sp.id = COALESCE(us.plan_id, 'free')
  GROUP BY sp.edit_limit, sp.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 완료!
-- 사용법:
-- SELECT * FROM increment_edit_count('user-uuid', 'my-site-slug');
-- SELECT * FROM get_monthly_usage('user-uuid');
