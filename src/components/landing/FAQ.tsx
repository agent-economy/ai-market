'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: '정말 30초만에 웹사이트가 만들어지나요?',
    answer: '네! 가게 이름과 업종만 입력하면 AI가 자동으로 디자인하고, 문구도 채워서 바로 사용 가능한 웹사이트를 만들어드립니다. 수정도 대화하듯 요청하면 됩니다.',
  },
  {
    question: '코딩이나 디자인 지식이 없어도 되나요?',
    answer: '전혀 필요 없습니다. 카카오톡 대화하듯 "여기 색상 바꿔줘", "사진 추가해줘" 같이 말씀하시면 AI가 알아서 해드립니다.',
  },
  {
    question: '무료 플랜으로도 충분한가요?',
    answer: '간단한 가게 소개 웹사이트와 블로그 글 몇 개 정도면 무료로 충분합니다. 더 많은 기능이나 워터마크 제거를 원하시면 프로 플랜을 추천드려요.',
  },
  {
    question: 'AI 전화 응대가 진짜 사람처럼 대화하나요?',
    answer: '최신 AI 음성 기술로 자연스러운 대화가 가능합니다. 예약 문의, 영업시간 안내, 위치 안내 등 기본적인 전화 응대는 사람과 구분하기 어려울 정도입니다.',
  },
  {
    question: '카카오톡 연동하면 내 채널 개인정보가 노출되나요?',
    answer: '절대 아닙니다. OAuth 방식으로 연결되어 비밀번호는 저희에게 전달되지 않습니다. 또한 고객 대화 내용은 암호화되어 저장되며, 언제든 삭제 요청이 가능합니다.',
  },
  {
    question: '해지는 언제든 가능한가요?',
    answer: '네, 위약금 없이 언제든 해지 가능합니다. 설정 > 구독 관리에서 클릭 한 번으로 해지되며, 결제일까지는 서비스를 계속 이용하실 수 있습니다.',
  },
  {
    question: '다른 웹사이트 빌더랑 뭐가 다른가요?',
    answer: '웹사이트만 만드는 게 아니라, 블로그 자동 발행, AI 전화 응대, 카카오톡 자동 응대까지 마케팅 전체를 자동화합니다. 사장님은 본업에만 집중하세요.',
  },
  {
    question: '기존 웹사이트가 있는데 옮길 수 있나요?',
    answer: '네, 기존 도메인을 연결하거나 콘텐츠를 옮겨오는 것도 도와드립니다. 프로 플랜 이상에서 커스텀 도메인 연결이 가능합니다.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 mb-4">
            ❓ 자주 묻는 질문
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            궁금한 점이 있으신가요?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            가장 많이 받는 질문들을 모았습니다
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <span className={`text-2xl text-gray-400 transition-transform ${openIndex === index ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-5 pt-0 text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            더 궁금한 점이 있으신가요?
          </p>
          <a
            href="https://pf.kakao.com/_qpxfRX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            💬 카카오톡으로 문의하기 →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
