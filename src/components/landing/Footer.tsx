'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 py-10 px-6 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">{t('brandName')}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('copyright')}
        </p>
        <div className="flex gap-5 text-xs text-gray-400 dark:text-gray-500">
          <Link href="/terms" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t('terms')}</Link>
          <Link href="/privacy" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t('privacy')}</Link>
          <a href="mailto:agentmarket.kr@gmail.com" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t('contact')}</a>
        </div>
      </div>
    </footer>
  );
}
