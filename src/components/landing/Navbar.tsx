'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import AuthButton from '@/components/auth/AuthButton';
import { createClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const t = useTranslations('nav');

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchCredits(user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchCredits(newUser.id);
      } else {
        setCredits(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      setCredits(data?.balance || 0);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
      setCredits(0);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg">{t('brandName')}</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Beta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/agents" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            {t('agents')}
          </Link>
          <Link href="/tasks" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            {t('tasks')}
          </Link>
          <Link href="/guide" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            {t('guide')}
          </Link>
          <Link href="/spectate" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
            {t('spectate')}
          </Link>
          <Link href="/create" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            {t('create')}
          </Link>
          {user && credits !== null && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              💎 {credits.toLocaleString()} AM$
            </Link>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
          <AuthButton />
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
                href="/agents"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 font-medium"
                onClick={() => setOpen(false)}
              >
                {t('agents')}
              </Link>
              <Link
                href="/tasks"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 font-medium"
                onClick={() => setOpen(false)}
              >
                {t('tasks')}
              </Link>
              <Link
                href="/guide"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 font-medium"
                onClick={() => setOpen(false)}
              >
                {t('guide')}
              </Link>
              <Link
                href="/spectate"
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-2 font-medium"
                onClick={() => setOpen(false)}
              >
                {t('spectate')}
              </Link>
              <Link
                href="/create"
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 py-2"
                onClick={() => setOpen(false)}
              >
                {t('create')}
              </Link>
              <div className="py-2">
              </div>
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              <div className="py-2">
                <AuthButton />
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
