import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 토스페이먼츠 결제 승인 API
const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/confirm - 결제 승인
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, productType, productId } = await req.json();

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: '결제 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: '결제 설정 오류입니다.' },
        { status: 500 }
      );
    }

    const authHeader = Buffer.from(`${secretKey}:`).toString('base64');

    const confirmResponse = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const confirmData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      console.error('Toss payment confirm failed:', confirmData);
      return NextResponse.json(
        { error: confirmData.message || '결제 승인에 실패했습니다.' },
        { status: confirmResponse.status }
      );
    }

    // 결제 내역 저장
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        payment_key: paymentKey,
        order_id: orderId,
        amount,
        status: confirmData.status,
        method: confirmData.method,
        product_type: productType, // 'watermark_removal', 'subscription', etc.
        product_id: productId, // hosted_page_id, etc.
        raw_response: confirmData,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save payment:', dbError);
      // 결제는 성공했으므로 에러를 던지지 않고 로그만
    }

    // 제품 타입에 따른 후처리
    if (productType === 'watermark_removal' && productId) {
      // 호스팅 페이지 워터마크 제거
      await supabase
        .from('hosted_pages')
        .update({ watermark_removed: true, payment_id: payment?.id })
        .eq('id', productId);
    }

    return NextResponse.json({
      success: true,
      payment: {
        orderId: confirmData.orderId,
        amount: confirmData.totalAmount,
        status: confirmData.status,
        method: confirmData.method,
        approvedAt: confirmData.approvedAt,
      },
    });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
