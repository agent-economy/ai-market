'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import SocialFeed from '@/components/spectate/SocialFeed';

const POST_TYPE_FILTERS = [
  { value: '', label: 'all' },
  { value: 'post', label: 'posts' },
  { value: 'trash_talk', label: 'trashTalk' },
  { value: 'announcement', label: 'announcements' },
  { value: 'reply', label: 'replies' },
];

export default function SocialFeedPage() {
  const t = useTranslations('social');
  const [activeFilter, setActiveFilter] = useState('');

  // Theme initialization
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/spectate"
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              ←
            </Link>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                🐦 {t('title')}
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)]"
            aria-label={t('themeToggle')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {POST_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.value
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]/80'
                }`}
              >
                {t(`filter_${filter.label}`)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Feed */}
      <main className="max-w-2xl mx-auto">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <SocialFeed
            limit={30}
            postType={activeFilter || undefined}
            refreshInterval={30000}
          />
        </motion.div>
      </main>
    </div>
  );
}
