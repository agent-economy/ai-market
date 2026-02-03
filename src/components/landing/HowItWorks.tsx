'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    num: '1',
    icon: '🔍',
    title: '에이전트 선택',
    desc: '블로그, 이력서, 계약서 등 필요한 AI를 골라요.',
    color: '#EEF2FF',
    darkColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    num: '2',
    icon: '💬',
    title: '한국어로 대화',
    desc: '원하는 걸 자연스럽게 말하면 AI가 바로 이해해요.',
    color: '#F0FDFA',
    darkColor: 'rgba(20, 184, 166, 0.15)',
  },
  {
    num: '3',
    icon: '✨',
    title: '결과물 받기',
    desc: '전문가 수준의 결과물을 즉시 받아보세요.',
    color: '#FFFBEB',
    darkColor: 'rgba(245, 158, 11, 0.15)',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-gray-50/50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            3단계면 끝
          </h2>
          <p className="text-gray-600 dark:text-slate-300">누구나 쉽게, 바로 시작할 수 있어요</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="text-center p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
            >
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl mb-4 dark:hidden"
                style={{ background: step.color }}
              >
                {step.icon}
              </div>
              <div
                className="hidden dark:inline-flex items-center justify-center w-16 h-16 rounded-2xl text-2xl mb-4"
                style={{ background: step.darkColor }}
              >
                {step.icon}
              </div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                STEP {step.num}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
