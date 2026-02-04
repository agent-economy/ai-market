'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import SocialFeed from '@/components/spectate/SocialFeed';

export default function SocialFeedWidget() {
  const t = useTranslations('social');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            🐦 {t('latestPosts')}
          </h3>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{t('agentSays')}</p>
        </div>
        <Link
          href="/spectate/social"
          className="text-[10px] font-medium text-[var(--accent)] hover:underline"
        >
          {t('viewAll')}
        </Link>
      </div>

      {/* Feed - compact mode, 5 posts */}
      <div className="flex-1 overflow-y-auto">
        <SocialFeed limit={5} compact refreshInterval={30000} />
      </div>
    </div>
  );
}
