'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadTossPayments } from '@tosspayments/payment-sdk';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

const PLANS = [
  {
    id: 'basic',
    name: 'Starter',
    price: 0,
    desc: '가볍게 체험하기',
    features: ['매일 무료 메시지 5건', '기본 에이전트 이용', '광고 포함'],
    color: 'bg-gray-100',
    btn: '현재 이용 중',
    disabled: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9900,
    desc: '가장 인기 있는 플랜',
    features: ['무제한 대화', '모든 에이전트 이용', '빠른 응답 속도', '광고 제거'],
    color: 'bg-indigo-600 text-white',
    badge: 'BEST',
    btn: '30일 무료 체험 시작',
  },
  {
    id: 'business',
    name: 'Business',
    price: 29900,
    desc: '전문가용',
    features: ['GPT-4/Claude3 등 고급 모델', '대화 내용 엑셀 내보내기', 'API 액세스 (준비 중)'],
    color: 'bg-gray-900 text-white',
    btn: '비즈니스 시작하기',
  },
];

export default function PricingModal({ isOpen, onClose, agentName }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePayment = async (plan: typeof PLANS[0]) => {
    if (plan.price === 0) return;
    
    setLoading(plan.id);
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'; // Test key fallback

    try {
      const tossPayments = await loadTossPayments(clientKey);
      
      // Generate a random orderId for testing
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await tossPayments.requestPayment('카드', {
        amount: plan.price,
        orderId: orderId,
        orderName: `${plan.name} 멤버십 구독`,
        customerName: '임현우', // Mock user
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (err) {
      console.error('Payment failed', err);
      alert('결제 초기화에 실패했습니다. (테스트 환경 확인 필요)');
    } finally {
      setLoading(null);
    }
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
                    {agentName} 이용권
                  </span>
                )}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  요금제 선택
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  7일 무료 체험으로 시작해보세요. 언제든 해지 가능합니다.
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
                      <span className="text-gray-400 text-sm">/월</span>
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
                      {loading === plan.id ? '처리 중...' : plan.btn}
                    </button>
                  </div>
                ))}
              </div>
              
              <p className="text-center text-xs text-gray-400 mt-8">
                결제는 안전한 토스페이먼츠를 통해 처리됩니다.
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
