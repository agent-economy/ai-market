'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

interface ConnectionCard {
  id: string;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  descriptionKo: string;
  connected: boolean;
  provider?: string;
  comingSoon?: boolean;
  href?: string;
}

const connections: ConnectionCard[] = [
  {
    id: 'naver-blog',
    name: 'Naver Blog',
    nameKo: '네이버 블로그',
    icon: '📝',
    description: 'Auto-post SEO-optimized blog articles',
    descriptionKo: 'SEO 최적화 블로그 글 자동 발행',
    connected: false,
    provider: 'naver',
    href: '/dashboard/blog',
  },
  {
    id: 'kakao-channel',
    name: 'KakaoTalk Channel',
    nameKo: '카카오톡 채널',
    icon: '💬',
    description: 'Auto-respond to customer inquiries',
    descriptionKo: '고객 문의 자동 응대',
    connected: false,
    provider: 'kakao',
    comingSoon: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    nameKo: '인스타그램',
    icon: '📸',
    description: 'Auto-post photos and stories',
    descriptionKo: '사진과 스토리 자동 포스팅',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'ai-phone',
    name: 'AI Phone',
    nameKo: 'AI 전화',
    icon: '📞',
    description: '24/7 phone answering service',
    descriptionKo: '24시간 전화 응대 서비스',
    connected: false,
    comingSoon: true,
  },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [activeConnections, setActiveConnections] = useState<string[]>([]);

  const handleConnect = async (card: ConnectionCard) => {
    if (card.comingSoon) return;
    
    if (card.href) {
      // Navigate to feature page
      window.location.href = card.href;
      return;
    }
    
    if (card.provider) {
      // OAuth 연결
      await signIn(card.provider, { callbackUrl: '/dashboard' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <span className="font-bold text-xl text-stone-900">에이전트마켓</span>
            </div>
            <nav className="flex items-center gap-4">
              <a href="/create" className="text-stone-600 hover:text-stone-900 text-sm">
                웹사이트 만들기
              </a>
              <button className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800">
                업그레이드
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            사장님, 안녕하세요! 👋
          </h1>
          <p className="text-stone-600">
            AI 비서가 대신 일할 준비가 되었습니다. 연결할 서비스를 선택하세요.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-3xl mb-2">0</div>
            <div className="text-sm text-stone-600">연결된 서비스</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-3xl mb-2">0</div>
            <div className="text-sm text-stone-600">이번 달 포스팅</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-3xl mb-2">0</div>
            <div className="text-sm text-stone-600">자동 응대</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="text-3xl mb-2">무료</div>
            <div className="text-sm text-stone-600">현재 플랜</div>
          </div>
        </div>

        {/* Connection Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            서비스 연결
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((card) => (
              <div
                key={card.id}
                className={`bg-white rounded-xl p-6 border shadow-sm transition-all ${
                  card.comingSoon 
                    ? 'border-stone-100 opacity-60' 
                    : card.connected 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{card.icon}</span>
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {card.nameKo}
                        {card.comingSoon && (
                          <span className="ml-2 text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-stone-600">{card.descriptionKo}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(card)}
                    disabled={card.comingSoon}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      card.comingSoon
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : card.connected
                          ? 'bg-green-100 text-green-700'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                  >
                    {card.connected ? '연결됨 ✓' : card.comingSoon ? '준비중' : card.href ? '사용하기 →' : '연결하기'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            최근 활동
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-8 text-center text-stone-500">
              <span className="text-4xl mb-4 block">📭</span>
              <p>아직 활동이 없습니다</p>
              <p className="text-sm mt-2">서비스를 연결하면 AI가 자동으로 일을 시작합니다</p>
            </div>
          </div>
        </div>

        {/* Website Card */}
        <div>
          <h2 className="text-xl font-bold text-stone-900 mb-4">
            내 웹사이트
          </h2>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl">🌐</span>
                <div>
                  <h3 className="font-semibold text-stone-900">웹사이트가 없습니다</h3>
                  <p className="text-sm text-stone-600">30초만에 AI로 웹사이트를 만들어보세요</p>
                </div>
              </div>
              <a
                href="/create"
                className="bg-gradient-to-r from-stone-900 to-stone-700 text-white px-6 py-3 rounded-lg text-sm font-medium hover:from-stone-800 hover:to-stone-600 transition-all"
              >
                웹사이트 만들기 →
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-stone-500">
            © 2026 에이전트마켓. 사장님, 할 일 대신 해드릴게요.
          </p>
        </div>
      </footer>
    </div>
  );
}
