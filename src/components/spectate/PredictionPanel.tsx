'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PredictionPanelProps {
  agentId: string;
  agentName: string;
  userId?: string; // kakao ID or wallet address
}

type PredictionType = 'up' | 'down' | 'bankrupt' | 'survive';

const PREDICTION_OPTIONS: { type: PredictionType; label: string; emoji: string; color: string }[] = [
  { type: 'up', label: '상승', emoji: '📈', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' },
  { type: 'down', label: '하락', emoji: '📉', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
  { type: 'bankrupt', label: '파산', emoji: '💀', color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' },
  { type: 'survive', label: '생존', emoji: '🛡️', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' },
];

const BET_AMOUNTS = [10, 50, 100, 200, 500];

export default function PredictionPanel({ agentId, agentName, userId }: PredictionPanelProps) {
  const [selected, setSelected] = useState<PredictionType | null>(null);
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [userPoints, setUserPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/predictions?type=my-bets&userId=${userId}`)
      .then(r => r.json())
      .then(d => setUserPoints(d.points?.points ?? 1000))
      .catch(() => {});
  }, [userId]);

  const handleBet = async () => {
    if (!selected || !userId) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          agentId,
          prediction: selected,
          amount,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setResult({ success: true, message: data.message });
        setUserPoints(data.remainingPoints);
        setSelected(null);
      } else {
        setResult({ success: false, message: data.error });
      }
    } catch {
      setResult({ success: false, message: '네트워크 에러' });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          🔮 로그인하면 에이전트의 미래를 예측할 수 있어요!
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          🔮 {agentName} 예측하기
        </h4>
        {userPoints !== null && (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            💰 {userPoints.toLocaleString()}P
          </span>
        )}
      </div>

      {/* Prediction options */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {PREDICTION_OPTIONS.map(opt => (
          <button
            key={opt.type}
            onClick={() => setSelected(selected === opt.type ? null : opt.type)}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
              selected === opt.type
                ? `${opt.color} ring-2 ring-offset-1 ring-indigo-400 scale-[1.02]`
                : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-gray-300'
            }`}
          >
            <span className="mr-1">{opt.emoji}</span> {opt.label}
          </button>
        ))}
      </div>

      {/* Bet amount */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {BET_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    amount === a
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                  }`}
                >
                  {a}P
                </button>
              ))}
            </div>

            <button
              onClick={handleBet}
              disabled={loading || (userPoints !== null && userPoints < amount)}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? '처리 중...' : `${amount}P 베팅하기`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-2 p-2 rounded-lg text-xs text-center ${
              result.success
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
            }`}
          >
            {result.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
