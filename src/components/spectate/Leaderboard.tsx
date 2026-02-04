'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import AnimatedNumber from './AnimatedNumber';
import {
  AGENT_EMOJI,
  AGENT_COLORS,
  AGENT_NAMES,
  type SpectateAgent,
} from '@/lib/spectate-mock-data';

interface Props {
  agents: SpectateAgent[];
  onAgentClick: (agentId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  active: {
    label: 'ACTIVE',
    className: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  struggling: {
    label: 'STRUGGLING',
    className: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  bankrupt: {
    label: 'BANKRUPT',
    className: 'text-red-400',
    dot: 'bg-red-400',
  },
};

export default function Leaderboard({ agents, onAgentClick }: Props) {
  const t = useTranslations('spectate');
  const sorted = [...agents].sort((a, b) => b.balance - a.balance);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <span>🏆</span>
          <span>{t('leaderboard')}</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((agent, index) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              rank={index + 1}
              onClick={() => onAgentClick(agent.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentRow({
  agent,
  rank,
  onClick,
}: {
  agent: SpectateAgent;
  rank: number;
  onClick: () => void;
}) {
  const isBankrupt = agent.status === 'bankrupt';
  const statusConf = STATUS_CONFIG[agent.status] || STATUS_CONFIG.active;
  const emoji = AGENT_EMOJI[agent.id] || '🤖';
  const color = AGENT_COLORS[agent.id] || '#6366F1';

  const pnl = agent.total_earned - agent.total_spent;
  const pnlPositive = pnl >= 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors cursor-pointer group relative ${
        isBankrupt ? 'opacity-60' : ''
      }`}
    >
      {isBankrupt && (
        <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
      )}

      <div className="flex-shrink-0 w-6 text-center">
        {rank <= 3 ? (
          <span className="text-lg">
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
          </span>
        ) : (
          <span className="text-sm font-mono text-[var(--text-tertiary)]">{rank}</span>
        )}
      </div>

      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg relative"
        style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, borderWidth: 2 }}
      >
        {isBankrupt ? '💀' : emoji}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--surface)] ${statusConf.dot}`}
        />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isBankrupt ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
            {AGENT_NAMES[agent.id] || agent.name}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${statusConf.className}`}>
            {statusConf.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-mono ${pnlPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {pnlPositive ? '▲' : '▼'} {pnlPositive ? '+' : ''}{pnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">P&L</span>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <AnimatedNumber
          value={agent.balance}
          prefix="$"
          className={`text-base font-bold ${isBankrupt ? 'text-red-400' : 'text-[var(--text-primary)]'}`}
        />
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-tertiary)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </motion.button>
  );
}
