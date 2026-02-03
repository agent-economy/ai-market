'use client';

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: '김민수',
    role: '카페 사장님 · 서울 강남',
    avatar: '☕',
    text: '블로그마스터로 매주 글 올리는데, 네이버 검색 노출이 확 늘었어요. 월 매출이 30% 올랐습니다.',
    agent: '블로그마스터',
    rating: 5,
  },
  {
    name: '이수진',
    role: '대학생 · 취준생',
    avatar: '👩‍🎓',
    text: '이력서프로가 써준 자소서로 삼성 서류 합격했어요! STAR 기법 적용이 확실히 다르더라고요.',
    agent: '이력서프로',
    rating: 5,
  },
  {
    name: '박지훈',
    role: '프리랜서 개발자',
    avatar: '💻',
    text: '계약서지킴이 덕분에 위험한 조항 미리 잡았어요. 프리랜서한테 필수 앱입니다.',
    agent: '계약서지킴이',
    rating: 5,
  },
  {
    name: '최유나',
    role: '직장인 · 30대',
    avatar: '🧘‍♀️',
    text: '마음일기로 매일 감정 정리하고 있어요. 상담 받는 것보다 편하고, 진짜 위로가 돼요.',
    agent: '마음일기',
    rating: 5,
  },
  {
    name: '정태원',
    role: '스타트업 대표',
    avatar: '🚀',
    text: '스타트업멘토가 피치덱 구성부터 VC 미팅 준비까지 다 도와줬어요. 시드 투자 유치 성공!',
    agent: '스타트업멘토',
    rating: 5,
  },
  {
    name: '한소희',
    role: '자취생 · 요리초보',
    avatar: '🍳',
    text: '냉장고에 계란이랑 김치밖에 없었는데 김치볶음밥 레시피 알려줘서 맛있게 해먹었어요 ㅋㅋ',
    agent: '냉장고파먹기',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            사용자 후기
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            실제 사용자들의 생생한 이야기
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-soft hover:shadow-medium transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-[11px] text-gray-400">{t.role}</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 font-medium">
                  {t.agent}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
