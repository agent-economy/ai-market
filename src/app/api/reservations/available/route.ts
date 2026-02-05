import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reservations/available?business_id=&date= - 예약 가능한 시간대 조회
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('business_id');
    const date = searchParams.get('date');
    
    // 필수 파라미터 검증
    if (!businessId) {
      return NextResponse.json(
        { error: 'business_id는 필수 파라미터입니다.' },
        { status: 400 }
      );
    }
    
    if (!date) {
      return NextResponse.json(
        { error: 'date는 필수 파라미터입니다. (YYYY-MM-DD)' },
        { status: 400 }
      );
    }
    
    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: '날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)' },
        { status: 400 }
      );
    }
    
    // 과거 날짜 체크
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const queryDate = new Date(date);
    
    if (queryDate < today) {
      return NextResponse.json({
        success: true,
        available_slots: [],
        message: '과거 날짜는 예약할 수 없습니다.',
      });
    }
    
    // 휴무일 체크
    const { data: blocked } = await supabase
      .from('blocked_dates')
      .select('reason')
      .eq('business_id', businessId)
      .eq('blocked_date', date)
      .single();
    
    if (blocked) {
      return NextResponse.json({
        success: true,
        available_slots: [],
        is_blocked: true,
        block_reason: blocked.reason || '휴무',
        message: '선택하신 날짜는 휴무일입니다.',
      });
    }
    
    // 먼저 Supabase Function으로 시도
    const { data: slotsFromRpc, error: rpcError } = await supabase.rpc(
      'get_available_slots',
      {
        p_business_id: businessId,
        p_date: date,
      }
    );
    
    if (!rpcError && slotsFromRpc) {
      // RPC 결과 포맷팅
      const formattedSlots = slotsFromRpc.map((slot: { slot_time: string; available_capacity: number }) => ({
        time: slot.slot_time.substring(0, 5), // HH:MM 형식
        available_capacity: slot.available_capacity,
      }));
      
      return NextResponse.json({
        success: true,
        business_id: businessId,
        date,
        available_slots: formattedSlots,
        total_available: formattedSlots.length,
      });
    }
    
    // Fallback: 직접 계산 (RPC 함수가 없는 경우)
    console.log('[available] RPC error or not available, using fallback:', rpcError?.message);
    
    // 요일 계산 (일=0, 월=1, ...)
    const dayOfWeek = queryDate.getDay();
    
    // 해당 요일의 시간대 설정 조회
    const { data: timeSlots, error: slotsError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('business_id', businessId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('start_time');
    
    if (slotsError) {
      console.error('[available] time_slots query error:', slotsError);
      return NextResponse.json(
        { error: '시간대 조회에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    if (!timeSlots || timeSlots.length === 0) {
      return NextResponse.json({
        success: true,
        available_slots: [],
        message: '해당 요일에는 예약을 받지 않습니다.',
      });
    }
    
    // 해당 날짜의 기존 예약 조회
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('time_slot')
      .eq('business_id', businessId)
      .eq('reservation_date', date)
      .not('status', 'in', '(cancelled,no_show)');
    
    // 예약 수 카운트 맵
    const reservationCounts: Record<string, number> = {};
    (existingReservations || []).forEach((r) => {
      const time = r.time_slot.substring(0, 5);
      reservationCounts[time] = (reservationCounts[time] || 0) + 1;
    });
    
    // 가능한 슬롯 계산
    const availableSlots: Array<{ time: string; available_capacity: number }> = [];
    const now = new Date();
    const isToday = date === now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const slot of timeSlots) {
      const startParts = slot.start_time.split(':');
      const endParts = slot.end_time.split(':');
      const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
      const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
      const duration = slot.slot_duration || 60;
      const maxCapacity = slot.max_capacity || 1;
      
      for (let time = startMinutes; time < endMinutes; time += duration) {
        // 오늘인 경우 현재 시간 이전 슬롯 제외
        if (isToday && time <= currentTime) continue;
        
        const hours = Math.floor(time / 60).toString().padStart(2, '0');
        const mins = (time % 60).toString().padStart(2, '0');
        const timeStr = `${hours}:${mins}`;
        
        const currentCount = reservationCounts[timeStr] || 0;
        const remaining = maxCapacity - currentCount;
        
        if (remaining > 0) {
          availableSlots.push({
            time: timeStr,
            available_capacity: remaining,
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      business_id: businessId,
      date,
      available_slots: availableSlots,
      total_available: availableSlots.length,
    });
  } catch (err) {
    console.error('[reservations/available] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
