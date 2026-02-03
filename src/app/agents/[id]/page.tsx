'use client';

import { useState, useRef, useEffect, use, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAgent, getRelatedAgents } from '@/data/agents';
import { CATEGORY_LABELS } from '@/types/agent';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';
import Navbar from '@/components/landing/Navbar';
import PricingModal from '@/components/payment/PricingModal';
import * as chatHistory from '@/lib/chatHistory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Suggested prompts now come from agent.suggestedPrompts in agents.ts

// ── Helper: format numbers like 12,847 or 1.2만
function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  return n.toLocaleString('ko-KR');
}

// ── Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}점`}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.min(Math.max(rating - (i - 1), 0), 1);
        return (
          <svg key={i} viewBox="0 0 20 20" className="w-4 h-4" aria-hidden>
            <defs>
              <linearGradient id={`star-fill-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="#FBBF24" />
                <stop offset={`${fill * 100}%`} stopColor="#D1D5DB" className="dark:stop-color-[#4B5563]" />
              </linearGradient>
            </defs>
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              fill={`url(#star-fill-${i})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

export default function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = getAgent(id);
  const relatedAgents = getRelatedAgents(id, 3);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showPricing, setShowPricing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<chatHistory.Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 대화 목록 로드
  useEffect(() => {
    if (agent) {
      setConversations(chatHistory.getConversations(agent.id));
    }
  }, [agent]);

  // 현재 대화 메시지 저장
  useEffect(() => {
    if (!currentConvId || !agent || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    chatHistory.addMessage(agent.id, currentConvId, lastMsg);
    setConversations(chatHistory.getConversations(agent.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

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

    // 새 대화면 자동 생성
    if (!currentConvId && agent) {
      const conv = chatHistory.createConversation(agent.id);
      setCurrentConvId(conv.id);
    }

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
    setCurrentConvId(null);
    inputRef.current?.focus();
  };

  const loadConversation = (conv: chatHistory.Conversation) => {
    setMessages(conv.messages);
    setCurrentConvId(conv.id);
    setShowHistory(false);
    setStreamingContent('');
  };

  const deleteConv = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!agent) return;
    chatHistory.deleteConversation(agent.id, convId);
    setConversations(chatHistory.getConversations(agent.id));
    if (currentConvId === convId) {
      handleNewChat();
    }
  };

  const prompts = agent.suggestedPrompts || [];
  const greeting = agent.greeting;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 bg-gray-50/30 dark:bg-[#0B1120]">
        <div className="max-w-3xl mx-auto px-4">
          {/* ═══ Agent header ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/agents')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
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
                  <h1 className="text-base font-bold text-gray-900 dark:text-white">{agent.nameKo}</h1>
                  {agent.status === 'beta' && <span className="badge badge-indigo text-[10px] py-0">BETA</span>}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {CATEGORY_LABELS[agent.category]} · {agent.pricing.type === 'free' ? '무료' : `${agent.pricing.freeMessages}회 무료`}
                  {agent.stats.rating > 0 && ` · ⭐ ${agent.stats.rating}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {conversations.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="대화 히스토리"
                >
                  📋 {conversations.length}
                </button>
              )}
              <button
                onClick={handleNewChat}
                className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                + 새 대화
              </button>
              <button
                onClick={() => setShowPricing(true)}
                className="text-xs font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
              >
                💎 요금제
              </button>
            </div>
          </motion.div>

          {/* ═══ History drawer ═══ */}
          <AnimatePresence>
            {showHistory && conversations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden"
              >
                <div className="p-3 max-h-48 overflow-y-auto space-y-1">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                        conv.id === currentConvId
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-xs">{conv.title}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          {conv.messages.length}개 메시지 · {new Date(conv.updatedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConv(conv.id, e)}
                        className="ml-2 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 text-xs shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Chat area ═══ */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-soft overflow-hidden" style={{ minHeight: '70vh' }}>
            <div className="flex flex-col" style={{ height: '70vh' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* ─── Empty state: Greeting + Agent info + Suggested chips ─── */}
                {messages.length === 0 && !loading && (
                  <div className="flex flex-col h-full">
                    {/* Agent info header */}
                    <div className="flex flex-col items-center text-center pt-6 pb-4 px-4">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${agent.color}22, ${agent.color}08)` }}
                      >
                        {agent.icon}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">
                        {agent.nameKo}
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed mb-3">
                        {agent.descriptionKo}
                      </p>
                      {/* Stats row */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                        {agent.stats.rating > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-full px-2.5 py-1">
                            <StarRating rating={agent.stats.rating} />
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{agent.stats.rating}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1 text-[11px] text-gray-600 dark:text-gray-300">
                          <span>💬</span>
                          <span className="font-semibold">{formatCount(agent.stats.totalChats)}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1 text-[11px] text-gray-600 dark:text-gray-300">
                          <span>👥</span>
                          <span className="font-semibold">{formatCount(agent.stats.monthlyUsers)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Greeting message bubble */}
                    {greeting && (
                      <div className="px-4">
                        <div className="flex gap-2.5 justify-start">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                            style={{ background: `${agent.color}12` }}
                          >
                            {agent.icon}
                          </div>
                          <div>
                            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                              <p className="text-sm leading-relaxed">{greeting}</p>
                            </div>
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 ml-1">🤖 AI가 생성한 답변입니다</p>
                          </div>
                        </div>

                        {/* Suggested prompt chips */}
                        {prompts.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 ml-9">
                            {prompts.map((prompt, i) => (
                              <button
                                key={i}
                                className="rounded-full px-4 py-2 text-sm cursor-pointer hover:opacity-80 transition-all border"
                                style={{
                                  background: `${agent.color}10`,
                                  color: agent.color,
                                  borderColor: `${agent.color}30`,
                                }}
                                onClick={() => handleSend(prompt)}
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                        style={{ background: `${agent.color}12` }}
                      >
                        {agent.icon}
                      </div>
                    )}
                    <div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700'
                        }`}
                      >
                        <MarkdownRenderer content={msg.content} isUser={msg.role === 'user'} />
                      </div>
                      {msg.role === 'assistant' && (
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 ml-1">🤖 AI가 생성한 답변입니다</p>
                      )}
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
                    <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700">
                      <MarkdownRenderer content={streamingContent} />
                      <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
                    </div>
                  </motion.div>
                )}

                {/* Loading dots */}
                {loading && !streamingContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5 justify-start">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                      style={{ background: `${agent.color}12` }}
                    >
                      {agent.icon}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-100 dark:border-gray-800 p-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    rows={1}
                    className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-300 dark:focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 transition-all"
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
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-gray-300 dark:text-gray-600">
                    AI가 생성한 답변은 참고용이며, 정확성을 보장하지 않습니다.
                  </p>
                  <button
                    onClick={() => setShowPricing(true)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    💎 Pro 업그레이드
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ Related Agents ═══ */}
          {relatedAgents.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6 mb-10"
            >
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                <span>✨</span> 비슷한 에이전트
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedAgents.map(ra => (
                  <Link key={ra.id} href={`/agents/${ra.id}`}>
                    <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md dark:hover:shadow-indigo-900/20 transition-all cursor-pointer">
                      {/* top row */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                          style={{ background: `${ra.color}14` }}
                        >
                          {ra.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {ra.nameKo}
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{CATEGORY_LABELS[ra.category]}</p>
                        </div>
                      </div>
                      {/* description */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                        {ra.descriptionKo}
                      </p>
                      {/* bottom stats */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                        {ra.stats.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <span className="text-amber-400">★</span> {ra.stats.rating}
                          </span>
                        )}
                        <span>💬 {formatCount(ra.stats.totalChats)}</span>
                        <span>👥 {formatCount(ra.stats.monthlyUsers)}</span>
                      </div>
                      {/* hover arrow */}
                      <span className="absolute top-4 right-4 text-gray-300 dark:text-gray-700 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 transition-colors text-sm">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        agentName={agent.nameKo}
      />
    </>
  );
}
