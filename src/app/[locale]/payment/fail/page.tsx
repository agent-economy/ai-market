'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <motion.div 
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-6xl mb-4 block">😢</span>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          결제 실패
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          결제가 완료되지 않았습니다
        </p>
        {message && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {message}
            {code && <span className="ml-2 text-xs">({code})</span>}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href="/create"
            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all"
          >
            다시 시도
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

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-4 animate-spin" />
        </div>
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
