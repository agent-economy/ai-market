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

interface UpdateReservationBody {
  status?: ReservationStatus;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  reservation_date?: string;
  time_slot?: string;
  party_size?: number;
  notes?: string;
}

// 상태 전이 규칙
const VALID_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  cancelled: [], // 취소된 예약은 상태 변경 불가
  completed: [], // 완료된 예약은 상태 변경 불가
  no_show: ['confirmed'], // 실수로 노쇼 처리한 경우 복구 가능
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/reservations/[id] - 단일 예약 조회
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reservation: data,
    });
  } catch (err) {
    console.error('[reservations/[id]/GET] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/reservations/[id] - 예약 상태 변경 및 정보 수정
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateReservationBody = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 기존 예약 조회
    const { data: existing, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json(
        { error: '예약을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 상태 변경 검증
    if (body.status && body.status !== existing.status) {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[existing.status as ReservationStatus] || [];
      
      if (!allowedTransitions.includes(body.status)) {
        return NextResponse.json(
          { 
            error: `'${existing.status}' 상태에서 '${body.status}' 상태로 변경할 수 없습니다.`,
            allowed_transitions: allowedTransitions,
          },
          { status: 400 }
        );
      }
    }
    
    // 날짜/시간 변경 시 예약 가능 여부 확인
    if (
      (body.reservation_date && body.reservation_date !== existing.reservation_date) ||
      (body.time_slot && body.time_slot !== existing.time_slot)
    ) {
      const newDate = body.reservation_date || existing.reservation_date;
      const newTime = body.time_slot || existing.time_slot;
      
      // 동일한 시간대에 다른 예약이 있는지 확인
      const { data: conflicting } = await supabase
        .from('reservations')
        .select('id')
        .eq('business_id', existing.business_id)
        .eq('reservation_date', newDate)
        .eq('time_slot', newTime)
        .not('id', 'eq', id)
        .not('status', 'in', '(cancelled,no_show)')
        .single();
      
      if (conflicting) {
        return NextResponse.json(
          { error: '변경하려는 시간대에 이미 다른 예약이 있습니다.' },
          { status: 409 }
        );
      }
    }
    
    // 업데이트할 필드만 추출
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'status', 'customer_name', 'customer_phone', 'customer_email',
      'reservation_date', 'time_slot', 'party_size', 'notes'
    ];
    
    for (const field of allowedFields) {
      if (body[field as keyof UpdateReservationBody] !== undefined) {
        updateData[field] = body[field as keyof UpdateReservationBody];
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }
    
    // 업데이트 실행
    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[reservations/[id]/PATCH] update error:', error);
      return NextResponse.json(
        { error: '예약 수정에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 상태 변경에 따른 메시지
    let message = '예약 정보가 수정되었습니다.';
    if (body.status) {
      const statusMessages: Record<ReservationStatus, string> = {
        pending: '예약이 대기 상태로 변경되었습니다.',
        confirmed: '예약이 확정되었습니다.',
        cancelled: '예약이 취소되었습니다.',
        completed: '방문이 완료 처리되었습니다.',
        no_show: '노쇼로 처리되었습니다.',
      };
      message = statusMessages[body.status] || message;
    }
    
    return NextResponse.json({
      success: true,
      reservation: data,
      message,
    });
  } catch (err) {
    console.error('[reservations/[id]/PATCH] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/reservations/[id] - 예약 삭제 (소프트 삭제 = 취소 처리)
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: '예약 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 취소 처리 (소프트 삭제)
    const { data, error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .not('status', 'in', '(cancelled,completed)')
      .select()
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { error: '예약을 취소할 수 없습니다. 이미 취소되었거나 완료된 예약입니다.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '예약이 취소되었습니다.',
      reservation: data,
    });
  } catch (err) {
    console.error('[reservations/[id]/DELETE] unexpected error:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
