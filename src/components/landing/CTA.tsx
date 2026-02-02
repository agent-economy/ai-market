'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 md:p-14 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              지금 바로 시작하세요
            </h2>
            <p className="text-indigo-100 mb-8">
              회원가입 없이 무료로 체험할 수 있어요.
              <br />
              AI가 당신의 시간을 아껴드립니다.
            </p>

            <Link
              href="/agents"
              className="inline-flex px-8 py-3.5 rounded-xl bg-white text-indigo-600 font-semibold text-base hover:bg-indigo-50 transition-all active:scale-98"
            >
              무료로 시작하기 →
            </Link>

            <p className="mt-6 text-xs text-indigo-200">
              💳 카드 등록 불필요 · 🔒 데이터 안전 · 🇰🇷 한국어 100%
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
