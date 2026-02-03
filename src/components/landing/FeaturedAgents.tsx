'use client';

import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getFeaturedAgents } from '@/data/agents';
import type { Locale } from '@/i18n/config';

export default function FeaturedAgents() {
  const featured = getFeaturedAgents();
  const t = useTranslations('featured');
  const tAgents = useTranslations('agents');
  const tCat = useTranslations('categories');
  const locale = useLocale() as Locale;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {featured.map((agent, i) => {
            const agentName = tAgents(`${agent.id}.name`);
            const agentDesc = tAgents(`${agent.id}.description`);
            const categoryKey = agent.category as string;

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href="/spectate">
                  <div className="card p-5 sm:p-6 h-full cursor-pointer group flex flex-col">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-xl group-hover:scale-110 transition-transform"
                        style={{ background: `${agent.color}15` }}
                      >
                        {agent.icon}
                      </div>
                      {agent.status === 'beta' && (
                        <span className="badge badge-indigo text-[10px]">BETA</span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                      {agentName}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                      {tCat(categoryKey)}
                    </span>

                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-2 sm:mt-3 leading-relaxed line-clamp-2 sm:line-clamp-3 flex-1">
                      {agentDesc}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3 sm:mt-4">
                      {agent.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 truncate">
                        {agent.pricing.freeMessages
                          ? t('freeCount', { count: agent.pricing.freeMessages })
                          : t('free')}
                      </span>
                      <span className="text-xs sm:text-sm text-indigo-500 font-medium group-hover:text-indigo-600 whitespace-nowrap ml-2">
                        {t('start')}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/spectate"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700"
          >
            {t('viewAll')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
