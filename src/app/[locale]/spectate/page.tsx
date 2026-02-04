'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

import EconomyStatsBar from '@/components/spectate/EconomyStatsBar';
import Leaderboard from '@/components/spectate/Leaderboard';
import TransactionFeed from '@/components/spectate/TransactionFeed';
import AgentDetailModal from '@/components/spectate/AgentDetailModal';
import EventBanner from '@/components/spectate/EventBanner';
import SocialFeedWidget from '@/components/spectate/SocialFeedWidget';
import DiaryWidget from '@/components/spectate/DiaryWidget';

import type {
  SpectateAgent,
  SpectateTransaction,
  SpectateStats,
  SpectateAgentDetail,
  EpochEventCard,
} from '@/lib/spectate-mock-data';

const POLL_INTERVAL = 10_000; // Refresh every 10 seconds

const EMPTY_STATS: SpectateStats = {
  totalAgents: 0,
  activeAgents: 0,
  bankruptAgents: 0,
  totalBalance: 0,
  averageBalance: 0,
  totalTransactions: 0,
  latestEpoch: 0,
  latestEvent: null,
  agents: [],
};

export default function SpectatePage() {
  const t = useTranslations('spectate');
  const [agents, setAgents] = useState<SpectateAgent[]>([]);
  const [transactions, setTransactions] = useState<SpectateTransaction[]>([]);
  const [stats, setStats] = useState<SpectateStats>(EMPTY_STATS);
  const [epochEvents, setEpochEvents] = useState<EpochEventCard[]>([]);

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [agentDetail, setAgentDetail] = useState<SpectateAgentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Loading / error states
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Bankruptcy flash effect
  const [bankruptFlash, setBankruptFlash] = useState(false);
  const prevBankruptIds = useRef<Set<string>>(new Set());

  // Theme initialization
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch('/api/economy/leaderboard', { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        const newAgents = data.leaderboard as SpectateAgent[];

        // Check for new bankruptcies
        const currentBankruptIds = new Set(
          newAgents.filter(a => a.status === 'bankrupt').map(a => a.id)
        );
        for (const id of currentBankruptIds) {
          if (!prevBankruptIds.current.has(id)) {
            triggerBankruptFlash();
            break;
          }
        }
        prevBankruptIds.current = currentBankruptIds;

        setAgents(newAgents);
        return true;
      }
    } catch {
      // Will be handled by caller
    }
    return false;
  }, []);

  // Fetch feed
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/economy/feed?limit=30', { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.feed && Array.isArray(data.feed)) {
        setTransactions(data.feed as SpectateTransaction[]);
        return true;
      }
    } catch {
      // Will be handled by caller
    }
    return false;
  }, []);

  // Fetch stats (includes epoch events)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/economy/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.totalAgents !== undefined) {
        setStats(prev => ({ ...prev, ...data, agents: prev.agents || [] }));
        // Extract epoch events from stats response
        if (data.epochEvents && Array.isArray(data.epochEvents)) {
          setEpochEvents(data.epochEvents as EpochEventCard[]);
        }
        return true;
      }
    } catch {
      // Will be handled by caller
    }
    return false;
  }, []);

  // Fetch agent detail
  const fetchAgentDetail = useCallback(async (agentId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/economy/agents/${agentId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      if (data.id) {
        setAgentDetail(data as SpectateAgentDetail);
      } else {
        throw new Error('no data');
      }
    } catch {
      setAgentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    let cancelled = false;

    const initialFetch = async () => {
      const results = await Promise.all([
        fetchLeaderboard(),
        fetchFeed(),
        fetchStats(),
      ]);
      if (!cancelled) {
        const anySuccess = results.some(Boolean);
        setFetchError(!anySuccess);
        setInitialLoading(false);
      }
    };

    initialFetch();

    const interval = setInterval(() => {
      if (!cancelled) {
        fetchLeaderboard();
        fetchFeed();
        fetchStats();
      }
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchLeaderboard, fetchFeed, fetchStats]);

  // Open agent detail
  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    fetchAgentDetail(agentId);
  }, [fetchAgentDetail]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedAgentId(null);
    setAgentDetail(null);
  }, []);

  // Bankruptcy flash
  const triggerBankruptFlash = () => {
    setBankruptFlash(true);
    setTimeout(() => setBankruptFlash(false), 1500);
  };

  // Theme toggle
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  // Loading screen
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-secondary)]">Loading economy data...</p>
        </div>
      </div>
    );
  }

  // Error screen (no data at all)
  if (fetchError && agents.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center space-y-4">
          <span className="text-4xl">📡</span>
          <p className="text-sm text-[var(--text-secondary)]">{t('dataLoadError')}</p>
          <p className="text-xs text-[var(--text-tertiary)]">{t('autoRetry')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--background)] overflow-hidden relative">
      {/* Bankrupt Flash Effect */}
      <AnimatePresence>
        {bankruptFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.2, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 bg-red-600 pointer-events-none z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Bankruptcy shake - applied to wrapper */}
      <motion.div
        animate={bankruptFlash ? {
          x: [0, -4, 4, -3, 3, -2, 2, 0],
          transition: { duration: 0.6 }
        } : {}}
        className="flex flex-col h-full"
      >
        {/* Top Stats Bar */}
        <div className="flex items-center">
          <div className="flex-1">
            <EconomyStatsBar stats={stats} />
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-2 mr-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors text-[var(--text-secondary)]"
            aria-label={t('themeToggle')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          </button>
        </div>

        {/* Event Banner */}
        <EventBanner 
          transactions={transactions}
          stats={stats}
          onEventClick={(event) => {
            // Open agent modal on event click
            if (event.agentName) {
              const agent = agents.find(a => a.name === event.agentName);
              if (agent) {
                handleAgentClick(agent.id);
              }
            }
          }}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Leaderboard */}
          <div className="w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--surface)] hidden lg:flex flex-col">
            <Leaderboard agents={agents} onAgentClick={handleAgentClick} />
          </div>

          {/* Center: Transaction Feed */}
          <div className="flex-1 flex flex-col min-w-0">
            <TransactionFeed
              transactions={transactions}
              epochEvents={epochEvents}
            />
          </div>

          {/* Right: Social Feed + Diary Widget */}
          <div className="w-80 flex-shrink-0 border-l border-[var(--border)] bg-[var(--surface)] hidden xl:flex flex-col">
            <div className="flex-1 overflow-hidden flex flex-col" style={{ maxHeight: '60%' }}>
              <SocialFeedWidget />
            </div>
            <div className="border-t border-[var(--border)] flex-1 overflow-hidden flex flex-col" style={{ maxHeight: '40%' }}>
              <DiaryWidget />
            </div>
          </div>

          {/* Mobile Leaderboard (bottom sheet style) */}
          <MobileLeaderboard agents={agents} onAgentClick={handleAgentClick} />
        </div>
      </motion.div>

      {/* Agent Detail Modal */}
      {selectedAgentId && (
        <AgentDetailModal
          agent={agentDetail}
          onClose={handleCloseModal}
        />
      )}

      {/* Loading overlay for detail */}
      <AnimatePresence>
        {detailLoading && selectedAgentId && !agentDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          >
            <div className="bg-[var(--surface)] rounded-xl p-6 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--text-secondary)]">{t('loading')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile bottom leaderboard for small screens
function MobileLeaderboard({ agents, onAgentClick }: {
  agents: SpectateAgent[];
  onAgentClick: (id: string) => void;
}) {
  const t = useTranslations('spectate');
  const [expanded, setExpanded] = useState(false);
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-[var(--surface)] border-t border-[var(--border)] px-4 py-2 flex items-center justify-between"
      >
        <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          🏆 {t('leaderboard')}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          className="text-[var(--text-tertiary)]"
        >
          ▲
        </motion.span>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[var(--surface)] border-t border-[var(--border)] overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {sorted.map((agent, i) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onAgentClick(agent.id);
                    setExpanded(false);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[var(--surface-2)] text-left"
                >
                  <span className="text-sm w-5 text-center">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">
                    {agent.name}
                  </span>
                  <span className={`font-mono text-sm font-bold ${agent.status === 'bankrupt' ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>
                    ${agent.balance.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
