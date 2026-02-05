'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Hero() {
  const t = useTranslations('hero');

  const floatingItems = [
    { label: t('floatTranslation'), x: '8%', y: '25%', delay: 0 },
    { label: t('floatCopywriting'), x: '85%', y: '20%', delay: 0.5 },
    { label: t('floatSeo'), x: '75%', y: '65%', delay: 1 },
    { label: t('floatCodeReview'), x: '12%', y: '68%', delay: 1.5 },
  ];

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-teal-50/40 dark:from-indigo-950/40 dark:via-[#0B1120] dark:to-teal-950/20" />

      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + item.delay * 0.3, duration: 0.5 }}
        >
          <motion.span
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            {item.label}
          </motion.span>
        </motion.div>
      ))}

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center break-keep">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50">
            {t('badge')}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-5 sm:mb-6 leading-[1.2] sm:leading-[1.15] text-gray-900 dark:text-white"
        >
          {t('heading1')}
          <br />
          <span className="gradient-text">{t('heading2')}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-slate-300 max-w-md sm:max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center px-4 sm:px-0"
        >
          <Link href="/create" className="btn-primary px-7 py-3 sm:py-3.5 text-sm sm:text-base shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            {t('ctaCreate')}
          </Link>
          <Link href="/tasks" className="btn-secondary px-7 py-3 sm:py-3.5 text-sm sm:text-base dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700">
            {t('ctaPostTask')}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-slate-500"
        >
          <span>{t('trustFee')}</span>
          <span>·</span>
          <span>{t('trustRevision')}</span>
          <span>·</span>
          <span>{t('trustAlways')}</span>
        </motion.div>
      </div>
    </section>
  );
}
