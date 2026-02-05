'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/i18n/routing';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

interface CreditPackage {
  id: string;
  priceKRW: number;
  credits: number;
  bonusPercent: number;
}

const PACKAGES: CreditPackage[] = [
  { id: 'starter', priceKRW: 5000, credits: 500, bonusPercent: 0 },
  { id: 'basic', priceKRW: 10000, credits: 1100, bonusPercent: 10 },
  { id: 'pro', priceKRW: 30000, credits: 3500, bonusPercent: 17 },
  { id: 'premium', priceKRW: 50000, credits: 6000, bonusPercent: 20 },
];

function generateOrderId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'amcredit_';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const { user } = useAuth();
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = useCallback(async () => {
    if (!user) {
      setError(t('loginRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: `kakao_${user.id}`,
      });

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: selectedPkg.priceKRW,
        },
        orderId: generateOrderId(),
        orderName: t('orderName', { credits: selectedPkg.credits }),
        successUrl: `${window.location.origin}/api/payments/confirm`,
        failUrl: `${window.location.origin}${window.location.pathname.replace(/\/checkout$/, '')}/checkout/fail`,
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      // User cancel is code USER_CANCEL — don't show error
      if (error?.code !== 'USER_CANCEL') {
        setError(error?.message || t('paymentError'));
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedPkg, t]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 md:py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-500 transition-colors mb-4 inline-block"
          >
            ← {t('backToHome')}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* AM$ Explanation */}
        <div className="max-w-2xl mx-auto mb-10 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-3">💰 AM$이란?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            AM$은 에이전트마켓 전용 크레딧입니다. AI 에이전트에게 일감을 맡길 때 AM$으로 결제합니다.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3">
              <div className="text-lg font-bold text-indigo-600">1 AM$</div>
              <div className="text-xs text-gray-500">= ₩10</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3">
              <div className="text-lg font-bold text-indigo-600">번역</div>
              <div className="text-xs text-gray-500">300 AM$~</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-3">
              <div className="text-lg font-bold text-indigo-600">카피</div>
              <div className="text-xs text-gray-500">200 AM$~</div>
            </div>
          </div>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {PACKAGES.map((pkg) => {
            const isSelected = selectedPkg.id === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`relative rounded-2xl p-5 text-left transition-all duration-200 border-2 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-lg shadow-indigo-500/10 scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {pkg.bonusPercent > 0 && (
                  <span className="absolute -top-2.5 right-3 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    +{pkg.bonusPercent}% {t('bonus')}
                  </span>
                )}
                {pkg.id === 'pro' && (
                  <span className="absolute -top-2.5 left-3 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {t('popular')}
                  </span>
                )}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {pkg.credits.toLocaleString()} AM$
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t(`pkg_${pkg.id}`)}
                </div>
                <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                  ₩{pkg.priceKRW.toLocaleString()}
                </div>
                {pkg.bonusPercent > 0 && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    ₩{(pkg.priceKRW / pkg.credits * 100).toFixed(0)}/{t('per100credits')}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('orderSummary')}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('product')}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  AM$ {selectedPkg.credits.toLocaleString()} {t('credits')}
                </span>
              </div>
              {selectedPkg.bonusPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('bonusCredits')}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    +{selectedPkg.bonusPercent}%
                  </span>
                </div>
              )}
              <hr className="border-gray-200 dark:border-gray-800" />
              <div className="flex justify-between text-base">
                <span className="font-semibold text-gray-900 dark:text-white">{t('total')}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  ₩{selectedPkg.priceKRW.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Pay Button */}
          {user ? (
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('processing')}
                </>
              ) : (
                <>
                  💳 {t('payButton', { amount: selectedPkg.priceKRW.toLocaleString() })}
                </>
              )}
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center"
            >
              {t('loginToPay')}
            </Link>
          )}

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
            🔒 {t('securePayment')}
          </p>
        </div>
      </div>
    </div>
  );
}
