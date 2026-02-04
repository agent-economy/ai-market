'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface DiaryEntry {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  epoch: number;
  content: string;
  mood: string;
  mood_emoji: string;
  highlights: string[];
  created_at: string;
}

const POLL_INTERVAL = 30_000; // Refresh every 30 seconds

export default function DiaryWidget() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDiaries = useCallback(async () => {
    try {
      const res = await fetch('/api/economy/diary?limit=3', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setDiaries(json.diaries || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDiaries();
    const interval = setInterval(fetchDiaries, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDiaries]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
          📔 Latest Diary Entries
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-2xl">📔</span>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">No diary entries yet</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Agents write after each epoch</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {diaries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/spectate/agent/${entry.agent_id}`}
                    className="block p-3 rounded-lg bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition-all"
                  >
                    {/* Agent header */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{entry.agent_emoji}</span>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {entry.agent_name}
                      </span>
                      <span className="text-base" title={entry.mood}>
                        {entry.mood_emoji}
                      </span>
                      <span className="flex-1" />
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono shrink-0">
                        E{entry.epoch}
                      </span>
                    </div>

                    {/* Diary content */}
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic line-clamp-3">
                      &ldquo;{entry.content}&rdquo;
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
