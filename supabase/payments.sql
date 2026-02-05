-- Payments Table for AI Market
-- 결제 내역 저장용 테이블
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════
-- PAYMENTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 토스페이먼츠 정보
  payment_key TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- 'DONE', 'CANCELED', etc.
  method TEXT, -- '카드', '가상계좌', etc.
  
  -- 제품 정보
  product_type TEXT NOT NULL, -- 'watermark_removal', 'subscription', 'custom_domain', etc.
  product_id UUID, -- 관련 hosted_page 또는 기타 ID
  
  -- 고객 정보 (옵션)
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- 원본 응답 저장
  raw_response JSONB,
  
  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_product ON payments(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- Add watermark_removed column to hosted_pages if not exists
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE hosted_pages 
ADD COLUMN IF NOT EXISTS watermark_removed BOOLEAN DEFAULT false;

ALTER TABLE hosted_pages 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Updated at trigger
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies (선택사항)
-- ═══════════════════════════════════════════════════════════════════════════

-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 관리자만 조회 가능
-- CREATE POLICY "Admin can read payments"
--   ON payments FOR SELECT
--   USING (auth.jwt() ->> 'role' = 'admin');
