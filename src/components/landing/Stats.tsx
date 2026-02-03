'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

function AnimatedNumber({ value, decimal }: { value: number; decimal?: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(decimal ? parseFloat((value * eased).toFixed(1)) : Math.floor(value * eased));
      if (current >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [inView, value, decimal]);

  return (
    <span ref={ref}>
      {decimal ? count.toFixed(1) : count.toLocaleString()}
    </span>
  );
}

export default function Stats() {
  const t = useTranslations('stats');
  const [liveStats, setLiveStats] = useState<{
    totalAgents: number;
    totalVolume: number;
    survivalRate: number;
    totalEpochs: number;
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/economy/stats');
        if (res.ok) {
          const data = await res.json();
          setLiveStats(data);
        }
      } catch {
        // fallback to defaults
      }
    }
    fetchStats();
  }, []);

  const stats = liveStats;

  const STATS = [
    { label: t('agents'), value: stats?.totalAgents ?? 5, suffix: t('agentSuffix'), icon: '🤖' },
    { label: t('chats'), value: stats?.totalVolume ?? 498, suffix: t('chatSuffix'), icon: '💬' },
    { label: t('rating'), value: stats?.survivalRate ?? 80.0, suffix: t('ratingSuffix'), icon: '⭐', decimal: true },
    { label: t('users'), value: stats?.totalEpochs ?? 6, suffix: t('userSuffix'), icon: '👥' },
  ];

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-slate-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 shadow-soft"
            >
              <span className="text-xl sm:text-2xl mb-1 sm:mb-2 block">{stat.icon}</span>
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                <AnimatedNumber value={stat.value} decimal={stat.decimal} />
                <span className="text-xs sm:text-base font-medium text-gray-500 dark:text-slate-400 ml-0.5">{stat.suffix}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
