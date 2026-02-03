'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  const { user, loading, signInWithKakao, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithKakao}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD835] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3C1E1E">
          <path d="M12 3C6.48 3 2 6.58 2 10.9c0 2.78 1.86 5.22 4.65 6.6l-1.18 4.35c-.1.36.32.64.63.42l5.17-3.43c.24.02.48.03.73.03 5.52 0 10-3.58 10-7.97S17.52 3 12 3z" />
        </svg>
        카카오 로그인
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const nickname = user.user_metadata?.name || user.email?.split('@')[0] || '사용자';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nickname}
            className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
            {nickname[0]}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{nickname}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              🎫 내 구독 관리
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              💬 대화 히스토리
            </button>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
