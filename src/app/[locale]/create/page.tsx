'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

type Style = 'modern' | 'minimal' | 'vivid' | 'warm';
type Color = 'indigo' | 'rose' | 'emerald' | 'amber' | 'slate';
type ViewMode = 'desktop' | 'mobile';
type Phase = 'input' | 'loading' | 'result';

const STYLES: { key: Style; emoji: string }[] = [
  { key: 'modern', emoji: '🏢' },
  { key: 'minimal', emoji: '⬜' },
  { key: 'vivid', emoji: '🎨' },
  { key: 'warm', emoji: '🌿' },
];

const COLORS: { key: Color; tw: string; ring: string }[] = [
  { key: 'indigo', tw: 'bg-indigo-500', ring: 'ring-indigo-400' },
  { key: 'rose', tw: 'bg-rose-500', ring: 'ring-rose-400' },
  { key: 'emerald', tw: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { key: 'amber', tw: 'bg-amber-500', ring: 'ring-amber-400' },
  { key: 'slate', tw: 'bg-slate-600', ring: 'ring-slate-400' },
];

const PROGRESS_MESSAGES_KO = [
  '비즈니스 분석 중...',
  '디자인 컨셉 구상 중...',
  '섹션 레이아웃 설계 중...',
  '마케팅 문구 작성 중...',
  '반응형 디자인 적용 중...',
  '마무리 터치 중...',
];

const PROGRESS_MESSAGES_EN = [
  'Analyzing your business...',
  'Designing the concept...',
  'Building section layouts...',
  'Writing marketing copy...',
  'Applying responsive design...',
  'Final touches...',
];

export default function CreatePage() {
  const t = useTranslations('create');

  const [description, setDescription] = useState('');
  const [style, setStyle] = useState<Style>('modern');
  const [color, setColor] = useState<Color>('indigo');
  const [phase, setPhase] = useState<Phase>('input');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [html, setHtml] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [error, setError] = useState('');
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const isKorean = t('title') === 'AI 웹사이트 만들기';
  const messages = isKorean ? PROGRESS_MESSAGES_KO : PROGRESS_MESSAGES_EN;

  const startProgress = useCallback(() => {
    let step = 0;
    setProgress(0);
    setProgressMsg(messages[0]);
    progressInterval.current = setInterval(() => {
      step++;
      if (step < messages.length) {
        setProgressMsg(messages[step]);
      }
      setProgress((prev) => Math.min(prev + Math.random() * 15 + 5, 90));
    }, 3500);
  }, [messages]);

  const stopProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgress(100);
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setError('');
    setPhase('loading');
    startProgress();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim(), style, color }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      stopProgress();
      setHtml(data.html);

      // Short delay for the progress to visually hit 100%
      setTimeout(() => setPhase('result'), 400);
    } catch (err) {
      stopProgress();
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPhase('input');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPhase('input');
    setHtml('');
    setProgress(0);
    setError('');
  };

  return (
    <>
      {/* Navbar - simplified */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg">
              {t('brandName')}
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            ← {t('backHome')}
          </Link>
        </div>
      </nav>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 pt-16">
        <AnimatePresence mode="wait">
          {/* ─── INPUT PHASE ─── */}
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto px-6 pt-12 pb-24"
            >
              {/* Header */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 mb-6"
                >
                  {t('badge')}
                </motion.div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-base">
                  {t('subtitle')}
                </p>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('descLabel')}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('descPlaceholder')}
                    rows={4}
                    maxLength={2000}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all text-base resize-none"
                  />
                  <p className="text-right text-xs text-gray-400 mt-1">
                    {description.length}/2000
                  </p>
                </div>

                {/* Style selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('styleLabel')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STYLES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setStyle(s.key)}
                        className={`relative px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          style === s.key
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <span className="text-xl mb-1 block">{s.emoji}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t(`style_${s.key}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {t('colorLabel')}
                  </label>
                  <div className="flex gap-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setColor(c.key)}
                        className={`w-10 h-10 rounded-full ${c.tw} transition-all ${
                          color === c.key
                            ? `ring-4 ${c.ring} ring-offset-2 dark:ring-offset-gray-900 scale-110`
                            : 'hover:scale-105'
                        }`}
                        title={t(`color_${c.key}`)}
                      />
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <button
                  onClick={handleGenerate}
                  disabled={!description.trim()}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-lg transition-all disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-300 dark:hover:shadow-indigo-800/40 active:scale-[0.98]"
                >
                  {t('generate')}
                </button>

                <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                  {t('freeNotice')}
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── LOADING PHASE ─── */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto px-6 pt-32 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-indigo-600 flex items-center justify-center"
              >
                <span className="text-white text-2xl">✨</span>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('loadingTitle')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                {progressMsg}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-3">{Math.round(progress)}%</p>
            </motion.div>
          )}

          {/* ─── RESULT PHASE ─── */}
          {phase === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24"
            >
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('resultTitle')} 🎉
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('resultSubtitle')}
                  </p>
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'desktop'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    🖥️ {t('desktop')}
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      viewMode === 'mobile'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    📱 {t('mobile')}
                  </button>
                </div>
              </div>

              {/* iframe preview */}
              <div
                className={`mx-auto transition-all duration-300 ${
                  viewMode === 'mobile' ? 'max-w-[390px]' : 'w-full'
                }`}
              >
                <div
                  className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
                    viewMode === 'mobile'
                      ? 'rounded-[2rem] border-[8px] border-gray-800 dark:border-gray-600'
                      : ''
                  }`}
                >
                  {viewMode === 'mobile' && (
                    <div className="h-6 bg-gray-800 dark:bg-gray-600 flex items-center justify-center">
                      <div className="w-20 h-3 rounded-full bg-gray-700 dark:bg-gray-500" />
                    </div>
                  )}
                  <iframe
                    srcDoc={html}
                    className={`w-full ${viewMode === 'mobile' ? 'h-[700px]' : 'h-[600px] sm:h-[700px]'}`}
                    sandbox="allow-scripts"
                    title="Landing page preview"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6 max-w-2xl mx-auto">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-[0.98]"
                >
                  📥 {t('download')}
                </button>
                <button
                  disabled
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium text-sm cursor-not-allowed relative"
                >
                  🌐 {t('connectDomain')}
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                    {t('comingSoon')}
                  </span>
                </button>
                <button
                  disabled
                  className="flex-1 py-3.5 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium text-sm cursor-not-allowed relative"
                >
                  ✏️ {t('requestEdit')}
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                    {t('comingSoon')}
                  </span>
                </button>
              </div>

              {/* Reset */}
              <div className="text-center mt-6">
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                >
                  🔄 {t('reset')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
