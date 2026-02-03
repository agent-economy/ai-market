'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

const STATS = [
  { label: '등록 에이전트', value: 18, suffix: '개', icon: '🤖' },
  { label: '누적 대화', value: 89432, suffix: '건', icon: '💬' },
  { label: '평균 평점', value: 4.8, suffix: '/5', icon: '⭐', decimal: true },
  { label: '월간 사용자', value: 24500, suffix: '명', icon: '👥' },
];

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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
  return (
    <section className="py-16 px-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-soft"
            >
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                <AnimatedNumber value={stat.value} decimal={stat.decimal} />
                <span className="text-base font-medium text-gray-400 ml-0.5">{stat.suffix}</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
