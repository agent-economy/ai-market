'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';

function FailContent() {
  const params = useSearchParams();
  const code = params.get('code');
  const message = params.get('message');

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">결제 실패</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.
      </p>
      
      {(code || message) && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 max-w-sm mx-auto mb-8 text-left">
          <div className="space-y-2 text-sm">
            {code && (
              <div className="flex justify-between">
                <span className="text-gray-400">에러코드</span>
                <span className="text-red-600 dark:text-red-400 font-mono text-xs">{code}</span>
              </div>
            )}
            {message && (
              <div>
                <span className="text-gray-400 text-xs block mb-1">상세</span>
                <span className="text-gray-700 dark:text-gray-300 text-xs">{message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link href="/agents" className="btn-secondary px-6 py-3 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700">
          ← 돌아가기
        </Link>
        <Link href="/agents" className="btn-primary px-6 py-3 text-sm">
          다시 시도
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center bg-gray-50/30 dark:bg-gray-950 px-6">
        <Suspense fallback={<p className="text-gray-400">로딩 중...</p>}>
          <FailContent />
        </Suspense>
      </main>
    </>
  );
}
