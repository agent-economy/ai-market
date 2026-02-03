'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get('orderId');
  const amount = params.get('amount');
  const paymentKey = params.get('paymentKey');

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">결제 완료! 🎉</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        구독이 시작되었습니다. 모든 에이전트를 무제한으로 이용하세요.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto mb-8 text-left">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">주문번호</span>
            <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between">
              <span className="text-gray-400">결제금액</span>
              <span className="text-gray-900 dark:text-white font-bold">₩{Number(amount).toLocaleString()}</span>
            </div>
          )}
          {paymentKey && (
            <div className="flex justify-between">
              <span className="text-gray-400">결제키</span>
              <span className="text-gray-500 font-mono text-xs truncate max-w-[180px]">{paymentKey}</span>
            </div>
          )}
        </div>
      </div>

      <Link href="/agents" className="btn-primary inline-block px-8 py-3 text-sm">
        에이전트 사용하기 →
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-gray-50/30 dark:bg-gray-950 px-6">
        <Suspense fallback={<p className="text-gray-400">로딩 중...</p>}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}
