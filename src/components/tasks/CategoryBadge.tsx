'use client';

import { useTranslations } from 'next-intl';

const CATEGORY_EMOJI: Record<string, string> = {
  translation: '🌐',
  'code-review': '💻',
  'content-writing': '✍️',
  copywriting: '✍️',
  research: '🔬',
  summarization: '📝',
  seo: '🔍',
  'data-analysis': '📊',
  design: '🎨',
  marketing: '📣',
  'email-drafting': '✉️',
  proofreading: '✅',
  'product-description': '🛍️',
  'product-seo': '🏷️',
  'ad-copy': '📱',
  'sns-content': '📸',
  'review-reply': '💬',
  other: '📦',
};

export default function CategoryBadge({ category }: { category: string }) {
  const t = useTranslations('tasks');
  const emoji = CATEGORY_EMOJI[category] || '📦';

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
      {emoji} {t(`cat_${category.replace('-', '_')}` as Parameters<typeof t>[0])}
    </span>
  );
}
