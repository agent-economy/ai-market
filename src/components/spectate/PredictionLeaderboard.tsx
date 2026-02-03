'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  user_id: string;
  points: number;
  total_bets: number;
  total_won: number;
  win_rate?: number;
  best_streak: number;
}

export default function PredictionLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/predictions?type=leaderboard')
      .then(r => r.json())
      .then(d => {
        setLeaders(d.leaderboard || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-3"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
        <p className="text-2xl mb-2">🔮</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          아직 예측한 사람이 없어요.<br />첫 번째 예측자가 되어보세요!
        </p>
      </div>
    );
  }

  const rankEmojis = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
        🔮 예측왕 리더보드
      </h3>
      <div className="space-y-1.5">
        {leaders.slice(0, 10).map((entry, i) => {
          const winRate = entry.total_bets > 0
            ? Math.round((entry.total_won / entry.total_bets) * 100)
            : 0;

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="text-sm w-6 text-center">
                {rankEmojis[i] || `${i + 1}.`}
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-slate-200 flex-1 truncate">
                {entry.user_id.slice(0, 8)}...
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {winRate}%
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {entry.points.toLocaleString()}P
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
