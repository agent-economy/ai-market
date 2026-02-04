'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

export default function UserMenu() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user, loading, signInWithKakao, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('auth');

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

  // Kakao login disabled — auth system under review
  if (!user) {
    return null;
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={user.nickname}
            className="w-8 h-8 rounded-full border-2 border-indigo-200 dark:border-indigo-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
            {user.nickname[0]}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{user.nickname}</p>
            <p className="text-xs text-gray-400">{t('kakaoLabel')}</p>
          </div>
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('mySubscription')}
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('chatHistory')}
            </button>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-1">
            <button
              onClick={() => { signOut(); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
