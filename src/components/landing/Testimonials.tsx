'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Testimonials() {
  const t = useTranslations('testimonials');

  // Get items from translations (array)
  const items = [0, 1, 2, 3, 4, 5].map(i => ({
    name: t(`items.${i}.name`),
    role: t(`items.${i}.role`),
    avatar: t(`items.${i}.avatar`),
    text: t(`items.${i}.text`),
    agent: t(`items.${i}.agent`),
    rating: 5,
  }));

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-600 shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed mb-4">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-lg">
                    {item.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">{item.role}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-semibold">
                  {item.agent}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
