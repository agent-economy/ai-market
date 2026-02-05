'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';

interface TossPaymentProps {
  amount: number;
  orderName: string;
  orderId: string;
  productType: string;
  productId?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export default function TossPayment({
  amount,
  orderName,
  orderId,
  productType,
  productId,
  customerName = '고객',
  customerEmail,
  onSuccess,
  onError,
}: TossPaymentProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
          onError?.('결제 설정 오류입니다.');
          return;
        }

        const tossPayments = await loadTossPayments(clientKey);
        const paymentWidgets = tossPayments.widgets({ customerKey: `GUEST_${orderId}` });

        // 금액 설정
        await paymentWidgets.setAmount({
          currency: 'KRW',
          value: amount,
        });

        // 결제 수단 위젯 렌더링
        if (paymentMethodRef.current) {
          await paymentWidgets.renderPaymentMethods({
            selector: '#payment-method',
            variantKey: 'DEFAULT',
          });
        }

        // 약관 동의 위젯 렌더링
        if (agreementRef.current) {
          await paymentWidgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });
        }

        setWidgets(paymentWidgets);
        setIsReady(true);
      } catch (error) {
        console.error('Payment initialization failed:', error);
        onError?.('결제 초기화에 실패했습니다.');
      }
    };

    initializePayment();
  }, [amount, orderId, onError]);

  const handlePayment = async () => {
    if (!widgets || isProcessing) return;

    setIsProcessing(true);

    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success?productType=${productType}&productId=${productId || ''}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error: any) {
      console.error('Payment request failed:', error);
      onError?.(error.message || '결제 요청에 실패했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* 결제 금액 표시 */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          ₩{amount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{orderName}</p>
      </div>

      {/* 결제 수단 선택 */}
      <div 
        id="payment-method" 
        ref={paymentMethodRef}
        className="min-h-[200px]"
      />

      {/* 약관 동의 */}
      <div 
        id="agreement" 
        ref={agreementRef}
      />

      {/* 결제 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady || isProcessing}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-lg transition-all disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            처리 중...
          </span>
        ) : !isReady ? (
          '결제 준비 중...'
        ) : (
          `₩${amount.toLocaleString()} 결제하기`
        )}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-center text-gray-400">
        결제는 토스페이먼츠를 통해 안전하게 처리됩니다
      </p>
    </div>
  );
}
