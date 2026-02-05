'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { AGENTS } from '@/data/agents';
import type { Agent } from '@/types/agent';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'business', label: '비즈니스' },
  { id: 'creative', label: '크리에이티브' },
];

export default function AgentsPage() {
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = useMemo(() => {
    return AGENTS.filter(agent => {
      // Category filter
      if (selectedCategory !== 'all' && agent.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        return (
          agent.name.toLowerCase().includes(search) ||
          agent.nameKo.toLowerCase().includes(search) ||
          agent.description.toLowerCase().includes(search) ||
          agent.descriptionKo.toLowerCase().includes(search) ||
          agent.tags.some(tag => tag.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-sm font-medium mb-4">
              🤖 AI 고용 플랫폼
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI 에이전트
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              전문 AI 에이전트가 24시간 대기 중입니다. 즉시 결과물을 받아보세요.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Search */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="에이전트 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              다른 검색어나 카테고리를 시도해보세요.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
          >
            {filteredAgents.map((agent, index) => (
              <AgentCard key={agent.id} agent={agent} index={index} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  // Get price display
  const getPriceDisplay = () => {
    if (agent.pricing.type === 'freemium') {
      return '무료 시작';
    } else if (agent.pricing.type === 'pay-per-use' && agent.pricing.pricePerTask) {
      return `₩${agent.pricing.pricePerTask.toLocaleString()}~`;
    } else if (agent.pricing.monthlyPrice) {
      return `월 ₩${agent.pricing.monthlyPrice.toLocaleString()}`;
    }
    return '문의';
  };

  // Get CTA link - use ctaLink if available, otherwise default to chat
  const ctaLink = agent.ctaLink || `/chat/${agent.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Link href={ctaLink}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 group cursor-pointer h-full flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div 
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.gradient} flex items-center justify-center text-2xl`}
                >
                  {agent.icon}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {agent.nameKo}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {agent.stats.rating}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {agent.stats.totalChats.toLocaleString()}건
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 pb-4 flex-1">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
              {agent.descriptionKo}
            </p>
          </div>

          {/* Tags */}
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-1">
              {agent.tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center mt-auto">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {getPriceDisplay()}
            </div>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
              {agent.ctaText || '시작하기'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
