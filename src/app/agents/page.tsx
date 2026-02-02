'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AGENTS } from '@/data/agents';
import { CATEGORY_LABELS } from '@/types/agent';
import Navbar from '@/components/landing/Navbar';

const categories = [
  { key: 'all', label: '전체' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

export default function AgentsPage() {
  const [selected, setSelected] = useState('all');
  const filtered = selected === 'all' ? AGENTS : AGENTS.filter(a => a.category === selected);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-6 bg-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              AI 에이전트 카탈로그
            </h1>
            <p className="text-gray-500 text-sm">
              목적에 맞는 AI를 골라보세요. 모두 무료 체험 가능합니다.
            </p>
          </motion.div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelected(cat.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selected === cat.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/agents/${agent.id}`}>
                    <div className="card p-5 h-full cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform"
                          style={{ background: `${agent.color}12` }}
                        >
                          {agent.icon}
                        </div>
                        <div className="flex gap-1.5">
                          {agent.status === 'beta' && (
                            <span className="badge badge-indigo text-[10px] py-0.5">BETA</span>
                          )}
                          {agent.status === 'coming_soon' && (
                            <span className="badge text-[10px] py-0.5 bg-gray-100 text-gray-500">SOON</span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 mb-0.5">{agent.nameKo}</h3>
                      <span className="text-[11px] text-gray-400 font-medium">{CATEGORY_LABELS[agent.category]}</span>

                      <p className="text-sm text-gray-500 mt-2.5 leading-relaxed line-clamp-2">
                        {agent.descriptionKo}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {agent.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] rounded-md bg-gray-50 text-gray-400 font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {agent.pricing.type === 'free' ? '🆓 무료' : `${agent.pricing.freeMessages}회 무료`}
                        </span>
                        {agent.status !== 'coming_soon' && (
                          <span className="text-xs text-indigo-500 font-semibold group-hover:text-indigo-600">
                            시작 →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
