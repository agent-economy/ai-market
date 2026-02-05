'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const productType = searchParams.get('productType');
      const productId = searchParams.get('productId');

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsConfirming(false);
        return;
      }

      try {
        const res = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
            productType,
            productId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || '결제 승인에 실패했습니다.');
        }

        setResult(data.payment);
      } catch (err) {
        setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      } finally {
        setIsConfirming(false);
      }
    };

    confirmPayment();
  }, [searchParams]);

  if (isConfirming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">결제 확인 중...</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">잠시만 기다려주세요</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-950 p-4">
        <motion.div 
          className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-6xl mb-4 block">❌</span>
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            결제 실패
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Link
            href="/create"
            className="inline-block px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            돌아가기
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <motion.div 
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span 
          className="text-6xl mb-4 block"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          🎉
        </motion.span>
        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
          결제 완료!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          결제가 성공적으로 처리되었습니다
        </p>

        {result && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">주문번호</span>
              <span className="font-medium text-gray-900 dark:text-white">{result.orderId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">결제금액</span>
              <span className="font-bold text-green-600">₩{result.amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">결제수단</span>
              <span className="font-medium text-gray-900 dark:text-white">{result.method}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/create"
            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
          >
            새 페이지 만들기
          </Link>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            홈으로
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">결제 확인 중...</h2>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
