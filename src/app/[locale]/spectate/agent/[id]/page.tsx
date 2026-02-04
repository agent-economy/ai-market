'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AGENT_EMOJI } from '@/lib/spectate-mock-data';
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

const MOOD_EMOJI: Record<string, string> = {
  excited:    '🤩',
  worried:    '😰',
  confident:  '😎',
  desperate:  '😱',
  strategic:  '🧠',
  angry:      '😤',
  hopeful:    '🌟',
  neutral:    '😐',
};

interface AgentProfile {
  agent: {
    id: string;
    name: string;
    strategy: string;
    balance: number;
    total_earned: number;
    total_spent: number;
    status: string;
    created_at: string;
  };
  stats: {
    totalTrades: number;
    totalBuys: number;
    totalSells: number;
    totalBought: number;
    totalSold: number;
    profitLoss: number;
    loans: number;
    investments: number;
    sabotages: number;
    partnerships: number;
    recruitments: number;
  };
  topPartners: { id: string; count: number }[];
  skillBreakdown: Record<string, { bought: number; sold: number }>;
  balanceHistory: { epoch: number; balance: number }[];
  recentTransactions: Array<{
    id: string;
    buyer_id: string;
    seller_id: string;
    skill_type: string;
    amount: number;
    fee: number;
    epoch: number;
    narrative: string;
    created_at: string;
  }>;
  memoir: string | null;
}

export default function AgentChronicle() {
  const params = useParams();
  const agentId = params.id as string;
  const tAgents = useTranslations('agents');
  const [data, setData] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [memoirLoading, setMemoirLoading] = useState(false);
  const [memoir, setMemoir] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chronicle' | 'trades' | 'stats'>('chronicle');
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [diariesLoading, setDiariesLoading] = useState(true);

  const emoji = AGENT_EMOJI[agentId] || '🤖';
  let agentName: string;
  try { agentName = tAgents(`${agentId}.name`); } catch { agentName = agentId; }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/economy/agents/${agentId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [agentId]);

  const generateMemoir = async () => {
    setMemoirLoading(true);
    try {
      const res = await fetch(`/api/economy/agents/${agentId}?memoir=true`);
      if (res.ok) {
        const json = await res.json();
        setMemoir(json.memoir);
      }
    } catch { /* ignore */ }
    setMemoirLoading(false);
  };

  const fetchDiaries = useCallback(async () => {
    setDiariesLoading(true);
    try {
      const res = await fetch(`/api/economy/diary?agent_id=${agentId}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setDiaries(json.diaries || []);
      }
    } catch { /* ignore */ }
    setDiariesLoading(false);
  }, [agentId]);

  useEffect(() => { fetchData(); fetchDiaries(); }, [fetchData, fetchDiaries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-10 h-10 border-3 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <p className="text-lg text-[var(--text-secondary)]">Agent not found</p>
          <Link href="/spectate" className="text-[var(--accent)] mt-4 inline-block">← Back to Spectate</Link>
        </div>
      </div>
    );
  }

  const { agent, stats, topPartners, skillBreakdown, balanceHistory, recentTransactions } = data;
  const isAlive = agent.status === 'active';

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      {/* Hero Header */}
      <div className={`relative overflow-hidden ${isAlive ? 'bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10' : 'bg-gradient-to-br from-red-500/10 via-gray-500/10 to-gray-500/10'}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/spectate" className="text-sm text-[var(--text-tertiary)] hover:text-[var(--accent)] mb-4 inline-block">
            ← Back to Spectate
          </Link>
          
          <div className="flex items-start gap-4 mt-2">
            <motion.span 
              className="text-6xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {emoji}
            </motion.span>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{agentName}</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{agent.strategy}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isAlive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {isAlive ? '🟢 ACTIVE' : '💀 BANKRUPT'}
                </span>
                <span className="font-mono text-xl font-bold">
                  ${Number(agent.balance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <QuickStat label="Total Trades" value={String(stats.totalTrades)} />
            <QuickStat label="P&L" value={`${stats.profitLoss >= 0 ? '+' : ''}$${stats.profitLoss.toFixed(2)}`} 
              color={stats.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'} />
            <QuickStat label="Earned" value={`$${Number(agent.total_earned).toFixed(2)}`} />
            <QuickStat label="Spent" value={`$${Number(agent.total_spent).toFixed(2)}`} />
          </div>

          {/* Special Actions Summary */}
          {(stats.loans + stats.investments + stats.sabotages + stats.partnerships + stats.recruitments > 0) && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {stats.loans > 0 && <Badge emoji="💰" label={`${stats.loans} Loans`} color="blue" />}
              {stats.investments > 0 && <Badge emoji="📈" label={`${stats.investments} Investments`} color="purple" />}
              {stats.sabotages > 0 && <Badge emoji="🗡️" label={`${stats.sabotages} Sabotages`} color="red" />}
              {stats.partnerships > 0 && <Badge emoji="🤝" label={`${stats.partnerships} Partnerships`} color="cyan" />}
              {stats.recruitments > 0 && <Badge emoji="🔗" label={`${stats.recruitments} Recruits`} color="amber" />}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex gap-1 border-b border-[var(--border)] mt-4">
          {(['chronicle', 'trades', 'stats'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab 
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' 
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab === 'chronicle' ? '📖 Chronicle' : tab === 'trades' ? '📊 Trade History' : '📈 Stats'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'chronicle' && (
            <motion.div key="chronicle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
              {/* AI Memoir */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">📝 Agent&apos;s Memoir</h2>
                {memoir ? (
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
                    <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap italic">
                      &ldquo;{memoir}&rdquo;
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-3">— Written by {agentName}, AI Economy City</p>
                  </div>
                ) : (
                  <button
                    onClick={generateMemoir}
                    disabled={memoirLoading}
                    className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {memoirLoading ? '✍️ Writing memoir...' : `✨ Generate ${agentName}'s Memoir`}
                  </button>
                )}
              </div>

              {/* Agent Diary */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">📔 Agent Diary</h2>
                {diariesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                    <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    Loading diary...
                  </div>
                ) : diaries.length > 0 ? (
                  <div className="space-y-3">
                    {diaries.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-0.5 rounded">
                            Epoch {entry.epoch}
                          </span>
                          <span className="text-base" title={entry.mood}>
                            {MOOD_EMOJI[entry.mood] || '😐'}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)] capitalize">
                            {entry.mood}
                          </span>
                          <span className="flex-1" />
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
                          &ldquo;{entry.content}&rdquo;
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No diary entries yet. Diaries are written after each epoch.
                  </p>
                )}
              </div>

              {/* Balance Timeline */}
              {balanceHistory.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold mb-3">📈 Balance Journey</h2>
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-end gap-1 h-32">
                      {balanceHistory.map((point, i) => {
                        const maxBal = Math.max(...balanceHistory.map(p => p.balance), 100);
                        const height = Math.max(4, (point.balance / maxBal) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`E${point.epoch}: $${point.balance.toFixed(2)}`}>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: i * 0.02, type: 'spring' }}
                              className={`w-full rounded-t-sm ${
                                point.balance > 50 ? 'bg-emerald-500/60' 
                                : point.balance > 20 ? 'bg-amber-500/60' 
                                : 'bg-red-500/60'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-1">
                      <span>E{balanceHistory[0]?.epoch}</span>
                      <span>E{balanceHistory[balanceHistory.length - 1]?.epoch}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Partners */}
              {topPartners.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold mb-3">🤝 Top Trading Partners</h2>
                  <div className="flex flex-wrap gap-2">
                    {topPartners.map(p => (
                      <Link 
                        key={p.id}
                        href={`/spectate/agent/${p.id}`}
                        className="flex items-center gap-2 px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)]/30 transition-colors"
                      >
                        <span>{AGENT_EMOJI[p.id] || '🤖'}</span>
                        <span className="text-sm font-semibold">{p.id}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{p.count} trades</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'trades' && (
            <motion.div key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
              <div className="space-y-2">
                {recentTransactions.map((tx, i) => {
                  const isBuyer = tx.buyer_id === agentId;
                  const partnerId = isBuyer ? tx.seller_id : tx.buyer_id;
                  const partnerEmoji = AGENT_EMOJI[partnerId] || '🤖';
                  const isSpecial = ['loan', 'investment', 'partnership', 'sabotage', 'recruitment'].includes(tx.skill_type);
                  
                  return (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start gap-3 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg"
                    >
                      <span className="text-xs text-[var(--text-tertiary)] font-mono shrink-0 mt-0.5">E{tx.epoch}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`font-bold ${isBuyer ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isBuyer ? '−' : '+'}${tx.amount.toFixed(2)}
                          </span>
                          <span className="text-[var(--text-tertiary)]">
                            {isBuyer ? 'bought' : 'sold'} {tx.skill_type}
                          </span>
                          <span className="text-[var(--text-tertiary)]">{isBuyer ? 'from' : 'to'}</span>
                          <span>{partnerEmoji} {partnerId}</span>
                          {isSpecial && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                              {tx.skill_type.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {tx.narrative && (
                          <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2 italic">
                            {tx.narrative}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
              {/* Skill Breakdown */}
              <h2 className="text-lg font-bold mb-3">🎯 Skill Breakdown</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                {Object.entries(skillBreakdown).map(([skill, data]) => (
                  <div key={skill} className="flex items-center justify-between px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
                    <span className="text-sm font-semibold">{skill}</span>
                    <div className="flex gap-3 text-xs font-mono">
                      <span className="text-red-400">−${data.bought.toFixed(2)}</span>
                      <span className="text-emerald-400">+${data.sold.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Raw Numbers */}
              <h2 className="text-lg font-bold mb-3">📊 Full Stats</h2>
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Status" value={agent.status.toUpperCase()} />
                <StatCard label="Balance" value={`$${Number(agent.balance).toFixed(2)}`} />
                <StatCard label="Total Earned" value={`$${Number(agent.total_earned).toFixed(2)}`} />
                <StatCard label="Total Spent" value={`$${Number(agent.total_spent).toFixed(2)}`} />
                <StatCard label="Buy Orders" value={String(stats.totalBuys)} />
                <StatCard label="Sell Orders" value={String(stats.totalSells)} />
                <StatCard label="Created" value={new Date(agent.created_at).toLocaleDateString()} />
                <StatCard label="Net P&L" value={`${stats.profitLoss >= 0 ? '+' : ''}$${stats.profitLoss.toFixed(2)}`} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--surface)]/50 border border-[var(--border)] rounded-lg px-3 py-2 text-center">
      <p className="text-[10px] uppercase text-[var(--text-tertiary)]">{label}</p>
      <p className={`text-lg font-bold font-mono ${color || 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}

function Badge({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[color] || ''}`}>
      {emoji} {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3">
      <p className="text-[10px] uppercase text-[var(--text-tertiary)]">{label}</p>
      <p className="text-sm font-bold font-mono">{value}</p>
    </div>
  );
}
