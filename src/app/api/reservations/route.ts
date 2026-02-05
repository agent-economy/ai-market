import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

interface CreateReservationBody {
  business_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  reservation_date: string; // YYYY-MM-DD
  time_slot: string; // HH:MM
  party_size?: number;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════════════════

const PHONE_REGEX = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function normalizePhone(phone: string): string {
  return phone.replace(/-/g, '');
}

function validateReservationInput(body: CreateReservationBody): string | null {
  if (!body.business_id) return 'business_id는 필수 항목입니다.';
  if (!body.customer_name?.trim()) return '예약자 이름을 입력해주세요.';
  if (!body.customer_phone) return '연락처를 입력해주세요.';
  if (!PHONE_REGEX.test(body.customer_phone)) return '올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)';
  if (!body.reservation_date) return '예약 날짜를 선택해주세요.';
  if (!DATE_REGEX.test(body.reservation_date)) return '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)';
  if (!body.time_slot) return '예약 시간을 선택해주세요.';
  if (!TIME_REGEX.test(body.time_slot)) return '시간 형식이 올바르지 않습니다. (HH:MM)';
  
  // 과거 날짜 체크
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(body.reservation_date);
  if (reservationDate < today) return '과거 날짜로는 예약할 수 없습니다.';
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/reservations - 예약 생성
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body: CreateReservationBody = await req.json();
    
    // 입력 검증
    const validationError = validateReservationInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    
    const {
      business_id,
      customer_name,
      customer_phone,
      customer_email,
      reservation_date,
      time_slot,
      party_size = 1,
      notes,
    } = body;
    
    // 예약 가능 여부 확인 (Supabase Function 호출)
    const { data: isAvailable, error: availError } = await supabase.rpc(
      'is_slot_available',
      {
        p_business_id: business_id,
        p_date: reservation_date,
        p_time: time_slot,
      }
    );
    
    if (availError) {
      console.error('[reservations/POST] availability check error:', availError);
      // Function이 없을 경우 fallback으로 직접 체크
      const { data: existing } = await supabase
        .from('reservations')
        .select('id')
        .eq('business_id', business_id)
        .eq('reservation_date', reservation_date)
        .eq('time_slot', time_slot)
        .not('status', 'in', '(cancelled,no_show)')
        .single();
      
      if (existing) {
        return NextResponse.json(
          { error: '선택하신 시간대는 이미 예약이 완료되었습니다. 다른 시간을 선택해주세요.' },
          { status: 409 }
        );
      }
    } else if (!isAvailable) {
      return NextResponse.json(
        { error: '선택하신 시간대는 예약이 불가능합니다. 다른 시간을 선택해주세요.' },
        { status: 409 }
      );
    }
    
    // 예약 생성
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        business_id,
        customer_name: customer_name.trim(),
        customer_phone: normalizePhone(customer_phone),
        customer_email: customer_email?.trim() || null,
        reservation_date,
        time_slot,
        party_size,
        notes: notes?.trim() || null,
        status: 'pending',
      })
      .select('id, customer_name, reservation_date, time_slot, status, created_at')
      .single();
    
    if (error) {
      console.error('[reservations/POST] insert error:', error);
      return NextResponse.json(
        { error: '예약 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reservation: data,
      message: '예약이 접수되었습니다. 확정 안내를 기다려주세요.',
    });
  } catch (err) {
    console.error('[reservations/POST] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reservations?business_id=&status=&date=&page=&limit= - 예약 목록
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const status = searchParams.get('status') as ReservationStatus | null;
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'business_id는 필수 파라미터입니다.' },
        { status: 400 }
      );
    }
    
    // 쿼리 빌드
    let query = supabase
      .from('reservations')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('reservation_date', { ascending: true })
      .order('time_slot', { ascending: true });
    
    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }
    
    if (date) {
      query = query.eq('reservation_date', date);
    }
    
    // 페이지네이션
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('[reservations/GET] query error:', error);
      return NextResponse.json(
        { error: '예약 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reservations: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[reservations/GET] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
