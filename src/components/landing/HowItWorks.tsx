'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  const steps = [
    {
      num: '1',
      icon: '🔍',
      title: t('step1Title'),
      desc: t('step1Desc'),
      color: '#EEF2FF',
      darkColor: 'rgba(99, 102, 241, 0.15)',
    },
    {
      num: '2',
      icon: '💬',
      title: t('step2Title'),
      desc: t('step2Desc'),
      color: '#F0FDFA',
      darkColor: 'rgba(20, 184, 166, 0.15)',
    },
    {
      num: '3',
      icon: '✨',
      title: t('step3Title'),
      desc: t('step3Desc'),
      color: '#FFFBEB',
      darkColor: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-50/50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
