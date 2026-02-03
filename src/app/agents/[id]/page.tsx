'use client';

import { useState, useRef, useEffect, use, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAgent } from '@/data/agents';
import { CATEGORY_LABELS } from '@/types/agent';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';
import Navbar from '@/components/landing/Navbar';
import PricingModal from '@/components/payment/PricingModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  'soul-friend': ['오늘 하루 너무 힘들었어...', '남친이 연락을 안 해 😢', '회사 상사가 미치겠어'],
  'blog-master': ['강남 카페 블로그 글 써줘', '미용실 홍보 글 작성해줘', '맛집 리뷰 포맷 알려줘'],
  'resume-pro': ['삼성전자 마케팅 자소서 써줘', '신입 개발자 이력서 첨삭', '면접 예상 질문 뽑아줘'],
  'contract-guard': ['전세 계약서 검토해줘', '근로계약서 위험 조항 확인', '프리랜서 용역 계약 분석'],
  'study-buddy': ['미적분 쉽게 설명해줘', '경제학 수요공급 법칙', '퀴즈 내줘!'],
  'sns-creator': ['카페 인스타 게시물 써줘', '틱톡 릴스 스크립트', '해시태그 추천해줘'],
  'startup-mentor': ['아이디어 검증해줘', '피치덱 구성 도와줘', 'TIPS 지원 방법 알려줘'],
  'english-tutor': ["Let's practice English!", '비즈니스 이메일 작성 도와줘', '콩글리시 교정해줘'],
  'tax-helper': ['프리랜서 종소세 계산해줘', '간이과세자 부가세 신고', '절세 방법 알려줘'],
  'travel-planner': ['제주도 2박3일 코스 짜줘', '일본 오사카 3박4일 계획', '부산 맛집 여행 코스'],
  'food-recipe': ['계란이랑 밥만 있어', '닭가슴살로 뭐 해먹지?', '자취생 간단 저녁 추천'],
  'mood-diary': ['오늘 기분이 별로야', '불안한 마음을 정리하고 싶어', '감정일기 써보고 싶어'],
  'code-helper': ['Python 에러 해결해줘', 'React 코드 리뷰 부탁', 'API 설계 도와줘'],
};

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = getAgent(id);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  if (!agent) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-500">에이전트를 찾을 수 없습니다</p>
            <button onClick={() => router.push('/agents')} className="mt-3 text-indigo-500 hover:underline text-sm">
              ← 목록으로
            </button>
          </div>
        </main>
      </>
    );
  }

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msgText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setLoading(true);
    setStreamingContent('');

    try {
      // Try streaming first
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message: msgText,
          history: messages.slice(-10),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Stream failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamingContent(accumulated);
              }
            } catch {
              // skip
            }
          }
        }
      }

      // Finalize message
      if (accumulated) {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: accumulated,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      // Fallback to non-streaming
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agent.id,
            message: msgText,
            history: messages.slice(-10),
          }),
        });
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.response || '응답을 생성하지 못했습니다.',
            timestamp: Date.now(),
          },
        ]);
      } catch {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '⚠️ 일시적 오류가 발생했습니다. 다시 시도해주세요.',
            timestamp: Date.now(),
          },
        ]);
      }
    } finally {
      setLoading(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setStreamingContent('');
    setInput('');
    inputRef.current?.focus();
  };

  const prompts = SUGGESTED_PROMPTS[agent.id] || [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4">
          {/* Agent header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/agents')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ←
              </button>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${agent.color}12` }}
              >
                {agent.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-gray-900">{agent.nameKo}</h1>
                  {agent.status === 'beta' && <span className="badge badge-indigo text-[10px] py-0">BETA</span>}
                </div>
                <p className="text-[11px] text-gray-400">
                  {CATEGORY_LABELS[agent.category]} · {agent.pricing.type === 'free' ? '무료' : `${agent.pricing.freeMessages}회 무료`}
                  {agent.stats.rating > 0 && ` · ⭐ ${agent.stats.rating}`}
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="text-xs text-gray-400 hover:text-indigo-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
              >
                + 새 대화
              </button>
            )}
          </motion.div>

          {/* Chat area */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden" style={{ minHeight: '70vh' }}>
            <div className="flex flex-col" style={{ height: '70vh' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                      style={{ background: `${agent.color}12` }}
                    >
                      {agent.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {agent.nameKo}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
                      {agent.descriptionKo}
                    </p>

                    {/* Suggested prompts */}
                    <div className="w-full max-w-md space-y-2">
                      {prompts.map((prompt, i) => (
                        <button
                          key={i}
                          className="w-full text-left px-4 py-3 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                          onClick={() => handleSend(prompt)}
                        >
                          <span className="text-gray-300 group-hover:text-indigo-400 mr-2">→</span>
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Agent avatar */}
                    {msg.role === 'assistant' && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                        style={{ background: `${agent.color}12` }}
                      >
                        {agent.icon}
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 text-gray-800 border border-gray-100'
                      }`}
                    >
                      <MarkdownRenderer content={msg.content} isUser={msg.role === 'user'} />
                    </div>
                  </motion.div>
                ))}

                {/* Streaming response */}
                {streamingContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 justify-start">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                      style={{ background: `${agent.color}12` }}
                    >
                      {agent.icon}
                    </div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-gray-50 text-gray-800 border border-gray-100">
                      <MarkdownRenderer content={streamingContent} />
                      <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
                    </div>
                  </motion.div>
                )}

                {/* Loading dots (before stream starts) */}
                {loading && !streamingContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 justify-start">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                      style={{ background: `${agent.color}12` }}
                    >
                      {agent.icon}
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 p-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    rows={1}
                    className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {loading ? (
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                        <span className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      </span>
                    ) : '전송'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-300 mt-1.5 text-center">
                  AI가 생성한 답변은 참고용이며, 정확성을 보장하지 않습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
