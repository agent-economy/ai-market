'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// TODO: Re-enable when TossPayments integration is ready
// import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useTranslations, useLocale } from 'next-intl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

export default function PricingModal({ isOpen, onClose, agentName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const t = useTranslations('pricing');
  const locale = useLocale();

  const PLANS = [
    {
      id: 'basic',
      name: t('starter.name'),
      price: 0,
      desc: t('starter.desc'),
      features: [t('starter.feat1'), t('starter.feat2'), t('starter.feat3')],
      color: 'bg-gray-100',
      btn: t('starter.btn'),
      disabled: true,
    },
    {
      id: 'pro',
      name: t('pro.name'),
      price: 9900,
      desc: t('pro.desc'),
      features: [t('pro.feat1'), t('pro.feat2'), t('pro.feat3'), t('pro.feat4')],
      color: 'bg-indigo-600 text-white',
      badge: 'BEST',
      btn: t('pro.btn'),
    },
    {
      id: 'business',
      name: t('business.name'),
      price: 29900,
      desc: t('business.desc'),
      features: [t('business.feat1'), t('business.feat2'), t('business.feat3')],
      color: 'bg-gray-900 text-white',
      btn: t('business.btn'),
    },
  ];

  const handlePayment = async (plan: typeof PLANS[0]) => {
    if (plan.price === 0) return;

    // TODO: Re-enable when TossPayments integration is ready
    console.log('[Payment] Not yet available — plan:', plan.id);
    alert('결제 시스템 준비 중입니다. 곧 서비스됩니다!');

    /* Original TossPayments logic — re-enable later:
    setLoading(plan.id);
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
    try {
      const tossPayments = await loadTossPayments(clientKey);
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId: orderId,
        orderName: `${plan.name} Membership`,
        successUrl: `${window.location.origin}/${locale}/checkout/success`,
        failUrl: `${window.location.origin}/${locale}/checkout/fail`,
      });
    } catch (err) {
      console.error('Payment failed', err);
    } finally {
      setLoading(null);
    }
    */
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                {agentName && (
                  <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
                    {t('ticket', { name: agentName })}
                  </span>
                )}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-2xl border ${
                      plan.id === 'pro'
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 dark:border-gray-700'
                    } flex flex-col`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                        {plan.badge}
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-gray-400 mb-4 h-5">{plan.desc}</p>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ₩{plan.price.toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-sm">{t('perMonth')}</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handlePayment(plan)}
                      disabled={plan.disabled || !!loading}
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${
                        plan.id === 'basic'
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default'
                          : plan.id === 'pro'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === plan.id ? t('processing') : plan.btn}
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-gray-400 mt-8">
                {t('paymentInfo')}
              </p>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
