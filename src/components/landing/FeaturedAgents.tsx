'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { getFeaturedAgents } from '@/data/agents';
import { CATEGORY_LABELS } from '@/types/agent';

export default function FeaturedAgents() {
  const featured = getFeaturedAgents();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            인기 에이전트
          </h2>
          <p className="text-gray-500">
            지금 바로 무료로 사용할 수 있어요
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featured.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/agents/${agent.id}`}>
                <div className="card p-6 h-full cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
                      style={{ background: `${agent.color}15` }}
                    >
                      {agent.icon}
                    </div>
                    {agent.status === 'beta' && (
                      <span className="badge badge-indigo text-[10px]">BETA</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {agent.nameKo}
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    {CATEGORY_LABELS[agent.category]}
                  </span>

                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                    {agent.descriptionKo}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {agent.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-[11px] rounded-md bg-gray-50 text-gray-500 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {agent.pricing.freeMessages
                        ? `${agent.pricing.freeMessages}회 무료`
                        : '무료'}
                    </span>
                    <span className="text-sm text-indigo-500 font-medium group-hover:text-indigo-600">
                      시작하기 →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/agents"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm"
          >
            전체 에이전트 보기 →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
