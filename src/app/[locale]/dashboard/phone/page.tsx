'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  role: 'ai' | 'customer';
  text: string;
  timestamp: Date;
}

// Demo conversation script
const demoConversation: Omit<Message, 'timestamp'>[] = [
  { role: 'ai', text: '안녕하세요, 성수동 카페 모모입니다. 무엇을 도와드릴까요?' },
  { role: 'customer', text: '내일 오후 3시에 4명 예약 가능할까요?' },
  { role: 'ai', text: '네, 확인해볼게요. 잠시만요... 내일 3시에 4인 테이블 가능합니다. 예약 도와드릴까요?' },
  { role: 'customer', text: '네, 부탁드려요. 김철수로요.' },
  { role: 'ai', text: '김철수 고객님, 12월 7일 토요일 오후 3시, 4분 예약 완료되었습니다. 연락 가능한 전화번호 알려주시면 예약 확인 문자 보내드릴게요.' },
  { role: 'customer', text: '010-1234-5678이요.' },
  { role: 'ai', text: '네, 010-1234-5678로 확인 문자 발송해드렸습니다. 저희 카페에서 뵙겠습니다. 좋은 하루 되세요!' },
];

export default function PhoneDemoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [businessName, setBusinessName] = useState('성수동 카페 모모');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-play demo conversation
  useEffect(() => {
    if (!isPlaying || currentIndex >= demoConversation.length) {
      if (currentIndex >= demoConversation.length) {
        setIsPlaying(false);
      }
      return;
    }

    const delay = demoConversation[currentIndex].role === 'ai' ? 1500 : 2000;
    
    const timer = setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { ...demoConversation[currentIndex], timestamp: new Date() }
      ]);
      setCurrentIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentIndex]);

  const handleStartDemo = () => {
    setMessages([]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="text-stone-500 hover:text-stone-900">
              ← 대시보드
            </Link>
            <h1 className="font-bold text-lg text-stone-900">📞 AI 전화 응대</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Setup Section */}
        {!isSetupComplete ? (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-xl text-stone-900 mb-2">AI 전화 설정</h2>
            <p className="text-stone-600 mb-6">
              고객이 전화하면 AI가 친절하게 응대합니다. 예약, 영업시간 안내, 위치 안내까지.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  가게 이름
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                  placeholder="예: 성수동 카페 모모"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  AI 전화번호 할당
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={phoneNumber || '070-XXXX-XXXX'}
                    readOnly
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-500"
                  />
                  <button 
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                    onClick={() => setPhoneNumber('070-8942-' + Math.floor(1000 + Math.random() * 9000))}
                  >
                    번호 받기
                  </button>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  * 이 번호로 걸려오는 전화는 AI가 응대합니다
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSetupComplete(true)}
              disabled={!phoneNumber}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-600 disabled:from-stone-300 disabled:to-stone-300 disabled:cursor-not-allowed transition-all"
            >
              {phoneNumber ? '✓ 설정 완료하고 데모 보기' : '먼저 번호를 받으세요'}
            </button>
          </div>
        ) : (
          <>
            {/* Demo Phone UI */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden mb-6">
              {/* Phone Header */}
              <div className="bg-stone-900 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xl">📞</span>
                    </div>
                    <div>
                      <div className="font-medium">{phoneNumber}</div>
                      <div className="text-xs text-stone-400">AI 전화 응대 중</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-green-400 text-sm">
                        <span className="animate-pulse">●</span> 통화 중
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-stone-50">
                {messages.length === 0 && !isPlaying && (
                  <div className="text-center py-12 text-stone-500">
                    <span className="text-4xl mb-4 block">📱</span>
                    <p>"데모 시작" 버튼을 눌러</p>
                    <p>AI 전화 응대를 체험해보세요</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        msg.role === 'ai'
                          ? 'bg-white border border-stone-200 text-stone-800'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      <div className="text-xs mb-1 opacity-60">
                        {msg.role === 'ai' ? `🤖 ${businessName} AI` : '👤 고객'}
                      </div>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))}

                {isPlaying && currentIndex < demoConversation.length && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl">
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Controls */}
              <div className="p-4 border-t border-stone-200 bg-white">
                <div className="flex gap-3">
                  {!isPlaying && messages.length === 0 && (
                    <button
                      onClick={handleStartDemo}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      ▶️ 데모 시작
                    </button>
                  )}
                  {(isPlaying || messages.length > 0) && (
                    <button
                      onClick={handleReset}
                      className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                    >
                      🔄 처음부터
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <span className="text-2xl mb-2 block">🕐</span>
                <h3 className="font-semibold text-stone-900 mb-1">24시간 응대</h3>
                <p className="text-sm text-stone-600">새벽에 전화 와도 AI가 친절하게 응대</p>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <span className="text-2xl mb-2 block">📅</span>
                <h3 className="font-semibold text-stone-900 mb-1">자동 예약</h3>
                <p className="text-sm text-stone-600">예약 접수 후 확인 문자까지 자동 발송</p>
              </div>
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <span className="text-2xl mb-2 block">💬</span>
                <h3 className="font-semibold text-stone-900 mb-1">자연스러운 대화</h3>
                <p className="text-sm text-stone-600">진짜 사람처럼 맥락을 이해하고 응대</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">AI 전화 응대 시작하기</h3>
                  <p className="text-purple-200">월 ₩29,900부터 · 통화 무제한</p>
                </div>
                <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                  신청하기 →
                </button>
              </div>
            </div>
          </>
        )}

        {/* How it works */}
        <div className="mt-8 bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h2 className="font-bold text-lg text-stone-900 mb-4">어떻게 작동하나요?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h3 className="font-medium text-stone-900">AI 전화번호 받기</h3>
                <p className="text-sm text-stone-600">070 번호를 할당받아 명함, 웹사이트에 사용하세요</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h3 className="font-medium text-stone-900">가게 정보 학습</h3>
                <p className="text-sm text-stone-600">영업시간, 메뉴, 위치 등을 AI가 학습합니다</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h3 className="font-medium text-stone-900">고객 전화 자동 응대</h3>
                <p className="text-sm text-stone-600">예약, 문의, 안내 전화를 AI가 처리하고 결과를 알려드립니다</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
