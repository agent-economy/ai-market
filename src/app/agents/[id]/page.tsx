'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getAgent } from '@/data/agents';
import { CATEGORY_LABELS } from '@/types/agent';
import Navbar from '@/components/landing/Navbar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = getAgent(id);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message: userMsg.content,
          history: messages.slice(-10),
        }),
      });

      if (!res.ok) throw new Error('API error');
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
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholders: Record<string, string> = {
    'blog-master': '예: 강남 분위기 좋은 카페 블로그 글 써줘',
    'soul-friend': '예: 오늘 하루 너무 힘들었어...',
    'resume-pro': '예: 마케팅 3년차 자기소개서 써줘',
    'contract-guard': '예: 전세 계약서 검토해줘',
    'study-buddy': '예: 미적분 쉽게 설명해줘',
    'sns-creator': '예: 새 카페 인스타 게시물 캡션 써줘',
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4">
          {/* Agent header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-5 flex items-center gap-3"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: `${agent.color}12` }}
            >
              {agent.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{agent.nameKo}</h1>
                {agent.status === 'beta' && <span className="badge badge-indigo text-[10px] py-0">BETA</span>}
              </div>
              <p className="text-xs text-gray-400">
                {CATEGORY_LABELS[agent.category]} · {agent.pricing.freeMessages ? `${agent.pricing.freeMessages}회 무료` : '무료'}
              </p>
            </div>
          </motion.div>

          {/* Chat area */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden" style={{ minHeight: '65vh' }}>
            <div className="flex flex-col" style={{ height: '65vh' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <span className="text-4xl mb-3">{agent.icon}</span>
                    <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                      {agent.nameKo}에게 물어보세요
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm mb-5">
                      {agent.descriptionKo}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {agent.tags.map(tag => (
                        <button
                          key={tag}
                          className="px-3 py-1.5 text-xs rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                          onClick={() => { setInput(`#${tag} 관련 도움이 필요해요`); inputRef.current?.focus(); }}
                        >
                          #{tag}
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
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
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
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholders[agent.id] || '메시지를 입력하세요...'}
                    rows={1}
                    className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    style={{ minHeight: '42px', maxHeight: '100px' }}
                    disabled={agent.status === 'coming_soon'}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading || agent.status === 'coming_soon'}
                    className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {loading ? '···' : '전송'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
