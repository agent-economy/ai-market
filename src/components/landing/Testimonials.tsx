'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function Testimonials() {
  const t = useTranslations('testimonials');

  const rawItems = t.raw('items') as Array<{
    service: string;
    traditionalPrice: string;
    traditionalSpeed: string;
    traditionalRevisions: string;
    agentPrice: string;
    agentSpeed: string;
    agentRevisions: string;
  }> | undefined;

  const items = (rawItems ?? []).map((_, i) => ({
    service: t(`items.${i}.service`),
    traditionalPrice: t(`items.${i}.traditionalPrice`),
    traditionalSpeed: t(`items.${i}.traditionalSpeed`),
    traditionalRevisions: t(`items.${i}.traditionalRevisions`),
    agentPrice: t(`items.${i}.agentPrice`),
    agentSpeed: t(`items.${i}.agentSpeed`),
    agentRevisions: t(`items.${i}.agentRevisions`),
  }));

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
          <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300">
            {t('subtitle')}
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              {t('savingBadge')}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {t('speedBadge')}
            </span>
          </div>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="hidden sm:block"
        >
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left p-4 text-sm font-bold text-gray-900 dark:text-white">
                    {t('headerService')}
                  </th>
                  <th className="text-center p-4 text-sm font-bold text-gray-400 dark:text-slate-500">
                    {t('headerTraditional')}
                  </th>
                  <th className="text-center p-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {t('headerAgent')} ✨
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className={i < items.length - 1 ? 'border-b border-gray-100 dark:border-slate-700/50' : ''}>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.service}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-400 line-through">{item.traditionalPrice}</div>
                        <div className="text-xs text-gray-400">{item.traditionalSpeed} · {item.traditionalRevisions}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center bg-indigo-50/50 dark:bg-indigo-950/20">
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{item.agentPrice}</div>
                        <div className="text-xs text-indigo-500 dark:text-indigo-300">{item.agentSpeed} · {item.agentRevisions}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-slate-700/50">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.service}</span>
              </div>
              <div className="grid grid-cols-2">
                {/* Traditional side */}
                <div className="p-3 border-r border-gray-100 dark:border-slate-700/50">
                  <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-2">{t('headerTraditional')}</div>
                  <div className="text-sm text-gray-400 line-through mb-1">{item.traditionalPrice}</div>
                  <div className="text-xs text-gray-400">{item.traditionalSpeed}</div>
                  <div className="text-xs text-gray-400">{item.traditionalRevisions}</div>
                </div>
                {/* AgentMarket side */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">{t('headerAgent')} ✨</div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1">{item.agentPrice}</div>
                  <div className="text-xs text-indigo-500 dark:text-indigo-300">{item.agentSpeed}</div>
                  <div className="text-xs text-indigo-500 dark:text-indigo-300">{item.agentRevisions}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
