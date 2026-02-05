-- Reservation System Schema for AI Market
-- 예약 시스템 DB 스키마
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. TIME SLOTS TABLE (업체별 운영 시간대 설정)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=일, 1=월, ..., 6=토
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INTEGER NOT NULL DEFAULT 60, -- 슬롯 단위 (분)
  max_capacity INTEGER NOT NULL DEFAULT 1, -- 동시 예약 가능 인원
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT time_slots_valid_time CHECK (start_time < end_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_business ON time_slots(business_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_day ON time_slots(business_id, day_of_week);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. RESERVATIONS TABLE (예약 정보)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  reservation_date DATE NOT NULL,
  time_slot TIME NOT NULL,
  party_size INTEGER DEFAULT 1,
  status reservation_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_business ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(business_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(business_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(customer_phone);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. BLOCKED DATES TABLE (휴무일 / 특별 예약 불가일)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_business ON blocked_dates(business_id, blocked_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Time Slots Policies
CREATE POLICY "Time slots are viewable by everyone"
  ON time_slots FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage time slots"
  ON time_slots FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reservations Policies
CREATE POLICY "Reservations viewable by service role"
  ON reservations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update reservations"
  ON reservations FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Blocked Dates Policies
CREATE POLICY "Blocked dates are viewable by everyone"
  ON blocked_dates FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage blocked dates"
  ON blocked_dates FOR ALL
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- 특정 날짜/시간의 예약 수 확인 함수
CREATE OR REPLACE FUNCTION get_reservation_count(
  p_business_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reservations
    WHERE business_id = p_business_id
      AND reservation_date = p_date
      AND time_slot = p_time
      AND status NOT IN ('cancelled', 'no_show')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 예약 가능 여부 확인 함수
CREATE OR REPLACE FUNCTION is_slot_available(
  p_business_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_capacity INTEGER;
  v_current_count INTEGER;
  v_day_of_week INTEGER;
  v_is_blocked BOOLEAN;
BEGIN
  -- 휴무일 체크
  SELECT EXISTS(
    SELECT 1 FROM blocked_dates 
    WHERE business_id = p_business_id AND blocked_date = p_date
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- 요일 계산 (일=0, 월=1, ...)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- 해당 시간대의 max_capacity 조회
  SELECT max_capacity INTO v_max_capacity
  FROM time_slots
  WHERE business_id = p_business_id
    AND day_of_week = v_day_of_week
    AND p_time >= start_time
    AND p_time < end_time
    AND is_active = true
  LIMIT 1;
  
  -- 시간대 설정이 없으면 예약 불가
  IF v_max_capacity IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 현재 예약 수 조회
  v_current_count := get_reservation_count(p_business_id, p_date, p_time);
  
  RETURN v_current_count < v_max_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 특정 날짜의 예약 가능한 시간대 목록 반환
CREATE OR REPLACE FUNCTION get_available_slots(
  p_business_id UUID,
  p_date DATE
)
RETURNS TABLE(slot_time TIME, available_capacity INTEGER) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_slot RECORD;
  v_current_time TIME;
  v_current_count INTEGER;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- 휴무일 체크
  IF EXISTS(SELECT 1 FROM blocked_dates WHERE business_id = p_business_id AND blocked_date = p_date) THEN
    RETURN;
  END IF;
  
  -- 해당 요일의 시간대 설정 순회
  FOR v_slot IN 
    SELECT start_time, end_time, slot_duration, max_capacity
    FROM time_slots
    WHERE business_id = p_business_id
      AND day_of_week = v_day_of_week
      AND is_active = true
    ORDER BY start_time
  LOOP
    v_current_time := v_slot.start_time;
    
    WHILE v_current_time < v_slot.end_time LOOP
      v_current_count := get_reservation_count(p_business_id, p_date, v_current_time);
      
      IF v_current_count < v_slot.max_capacity THEN
        slot_time := v_current_time;
        available_capacity := v_slot.max_capacity - v_current_count;
        RETURN NEXT;
      END IF;
      
      v_current_time := v_current_time + (v_slot.slot_duration || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_slots_updated_at
  BEFORE UPDATE ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. SAMPLE DATA (테스트용)
-- ═══════════════════════════════════════════════════════════════════════════

-- 예시: 특정 business_id에 대한 시간대 설정
-- INSERT INTO time_slots (business_id, day_of_week, start_time, end_time, slot_duration, max_capacity)
-- VALUES 
--   ('YOUR-BUSINESS-UUID', 1, '09:00', '18:00', 60, 2),  -- 월요일 09-18시, 1시간 단위, 2명 동시
--   ('YOUR-BUSINESS-UUID', 2, '09:00', '18:00', 60, 2),  -- 화요일
--   ('YOUR-BUSINESS-UUID', 3, '09:00', '18:00', 60, 2),  -- 수요일
--   ('YOUR-BUSINESS-UUID', 4, '09:00', '18:00', 60, 2),  -- 목요일
--   ('YOUR-BUSINESS-UUID', 5, '09:00', '18:00', 60, 2);  -- 금요일
