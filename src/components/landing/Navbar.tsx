'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import ThemeToggle from '@/components/ui/ThemeToggle';
import UserMenu from '@/components/auth/UserMenu';
import WalletButton from '@/components/wallet/WalletButton';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">{t('brandName')}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/spectate" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            {t('spectate')}
          </Link>
          <WalletButton />
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-500"
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              <Link
                href="/spectate"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 font-medium"
                onClick={() => setOpen(false)}
              >
                {t('spectate')}
              </Link>
              <div className="py-2">
                <WalletButton />
              </div>
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <Link
                href="/spectate"
                className="btn-primary px-5 py-2.5 text-sm text-center"
                onClick={() => setOpen(false)}
              >
                {t('startFree')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
