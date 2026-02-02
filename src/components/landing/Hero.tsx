'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const floatingAgents = [
  { emoji: '✍️', label: '블로그', x: '8%', y: '25%', delay: 0 },
  { emoji: '💜', label: 'AI친구', x: '85%', y: '20%', delay: 0.5 },
  { emoji: '📄', label: '이력서', x: '75%', y: '65%', delay: 1 },
  { emoji: '🛡️', label: '계약서', x: '12%', y: '68%', delay: 1.5 },
];

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white to-teal-50/40" />
      
      {/* Floating agent badges */}
      {floatingAgents.map((agent, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl shadow-soft border border-gray-100"
          style={{ left: agent.x, top: agent.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + agent.delay * 0.3, duration: 0.5 }}
        >
          <motion.span
            className="text-xl"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, delay: agent.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            {agent.emoji}
          </motion.span>
          <span className="text-sm font-medium text-gray-700">{agent.label}</span>
        </motion.div>
      ))}

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <span className="badge badge-indigo gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500" />
            </span>
            한국 최초 AI 에이전트 마켓
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5 leading-[1.15] text-gray-900"
        >
          AI가 일하는 시대,
          <br />
          <span className="gradient-text">당신은 골라만 쓰세요</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed"
        >
          블로그 대필, 이력서 작성, 계약서 분석, AI 친구까지.
          <br className="hidden sm:block" />
          검증된 AI 에이전트를 무료로 체험하세요.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/agents" className="btn-primary px-7 py-3.5 text-base">
            에이전트 둘러보기 →
          </Link>
          <Link href="/agents/blog-master" className="btn-secondary px-7 py-3.5 text-base">
            ✍️ 블로그 AI 무료 체험
          </Link>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-6 text-sm text-gray-400"
        >
          <span>🆓 무료 체험</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>💳 카드 불필요</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span>🇰🇷 한국어 100%</span>
        </motion.div>
      </div>
    </section>
  );
}
