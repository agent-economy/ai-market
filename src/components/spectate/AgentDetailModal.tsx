'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  AGENT_EMOJI,
  AGENT_COLORS,
  AGENT_NAMES,
  type SpectateAgentDetail,
} from '@/lib/spectate-mock-data';

interface Props {
  agent: SpectateAgentDetail | null;
  onClose: () => void;
}

export default function AgentDetailModal({ agent, onClose }: Props) {
  if (!agent) return null;

  return (
    <AnimatePresence>
      {agent && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <AgentHeader agent={agent} onClose={onClose} />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Strategy */}
              <Section title="전략">
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {agent.strategy}
                </p>
              </Section>

              {/* Skills */}
              <Section title="보유 스킬">
                <div className="flex flex-wrap gap-2">
                  {agent.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-xs rounded-lg font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>

              {/* Balance Chart */}
              <Section title="잔고 히스토리">
                <MiniChart
                  agentId={agent.id}
                  currentBalance={agent.balance}
                  transactions={agent.recentTransactions}
                />
              </Section>

              {/* Financial Summary */}
              <Section title="재무 요약">
                <div className="grid grid-cols-3 gap-3">
                  <FinancialCard
                    label="총 수입"
                    value={agent.total_earned}
                    color="text-emerald-400"
                    icon="📈"
                  />
                  <FinancialCard
                    label="총 지출"
                    value={agent.total_spent}
                    color="text-red-400"
                    icon="📉"
                  />
                  <FinancialCard
                    label="순 P&L"
                    value={agent.total_earned - agent.total_spent}
                    color={agent.total_earned - agent.total_spent >= 0 ? 'text-emerald-400' : 'text-red-400'}
                    icon={agent.total_earned - agent.total_spent >= 0 ? '💰' : '💸'}
                  />
                </div>
              </Section>

              {/* Recent Transactions */}
              <Section title="최근 거래">
                {agent.recentTransactions.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">거래 내역 없음</p>
                ) : (
                  <div className="space-y-2">
                    {agent.recentTransactions.map(tx => (
                      <MiniTransaction key={tx.id} tx={tx} agentId={agent.id} />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AgentHeader({ agent, onClose }: { agent: SpectateAgentDetail; onClose: () => void }) {
  const emoji = AGENT_EMOJI[agent.id] || '🤖';
  const color = AGENT_COLORS[agent.id] || '#6366F1';
  const isBankrupt = agent.status === 'bankrupt';

  return (
    <div
      className="relative px-4 py-5 border-b border-[var(--border)]"
      style={{ background: `linear-gradient(135deg, ${color}10, ${color}05)` }}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-tertiary)] transition-colors"
      >
        ✕
      </button>

      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl relative"
          style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, borderWidth: 2 }}
        >
          {isBankrupt ? '💀' : emoji}
          {/* 상태별 펄스 효과 */}
          {agent.status === 'active' && (
            <div className="absolute -top-1 -right-1">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </div>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            {agent.name}
            <StatusBadge status={agent.status} />
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-lg font-bold text-[var(--text-primary)]">
              ${agent.balance.toFixed(2)}
            </span>
            {/* P&L 표시 */}
            <span className={`text-sm font-semibold ${
              agent.total_earned - agent.total_spent >= 0 
                ? 'text-emerald-400' 
                : 'text-red-400'
            }`}>
              {agent.total_earned - agent.total_spent >= 0 ? '+' : ''}
              ${(agent.total_earned - agent.total_spent).toFixed(2)} P&L
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string; emoji: string }> = {
    active: { 
      label: 'Active', 
      className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', 
      emoji: '🟢'
    },
    struggling: { 
      label: 'Warning', 
      className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', 
      emoji: '🟡'
    },
    bankrupt: { 
      label: 'Bankrupt', 
      className: 'bg-red-500/20 text-red-400 border border-red-500/30', 
      emoji: '💀'
    },
  };
  const c = configs[status] || configs.active;
  return (
    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.className}`}>
      <span>{c.emoji}</span>
      <span>{c.label}</span>
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function FinancialCard({ label, value, color, icon }: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div className="bg-[var(--surface-2)] rounded-xl p-3 text-center">
      <span className="text-lg">{icon}</span>
      <div className={`font-mono font-bold text-sm mt-1 ${color}`}>
        ${Math.abs(value).toFixed(2)}
      </div>
      <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{label}</div>
    </div>
  );
}

function MiniChart({ agentId, currentBalance, transactions }: {
  agentId: string;
  currentBalance: number;
  transactions: { buyer_id: string; seller_id: string; amount: number; fee: number; epoch: number }[];
}) {
  if (transactions.length < 2) return (
    <div className="bg-[var(--surface-2)] rounded-xl p-4 text-center">
      <span className="text-2xl">📊</span>
      <p className="text-xs text-[var(--text-tertiary)] mt-2">거래 데이터 수집 중...</p>
    </div>
  );

  // Compute balance history by walking backward from current balance
  const rawPoints: { epoch: number; balance: number }[] = [];
  let balance = currentBalance;
  const latestEpoch = transactions[0]?.epoch || 0;
  rawPoints.push({ epoch: latestEpoch, balance });

  for (const tx of transactions) {
    if (tx.buyer_id === agentId) {
      balance += tx.amount; // Before buying, balance was higher
    } else if (tx.seller_id === agentId) {
      balance -= (tx.amount - tx.fee); // Before selling, balance was lower
    }
    rawPoints.push({ epoch: tx.epoch, balance: Math.max(0, balance) });
  }

  // Reverse to chronological order and dedupe by epoch (keep earliest per epoch)
  rawPoints.reverse();
  const seen = new Set<number>();
  const history = rawPoints.filter(p => {
    if (seen.has(p.epoch)) return false;
    seen.add(p.epoch);
    return true;
  });

  if (history.length < 2) return <p className="text-xs text-[var(--text-tertiary)]">데이터 부족</p>;

  const maxBal = Math.max(...history.map(h => h.balance));
  const minBal = Math.min(...history.map(h => h.balance));
  const range = maxBal - minBal || 1;

  const chartHeight = 80;
  const chartWidth = 300;
  const padding = 10;

  // Grid lines
  const gridLines: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * (chartHeight - padding * 2);
    gridLines.push(`M${padding},${y} L${chartWidth - padding},${y}`);
  }

  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (chartWidth - padding * 2);
    const y = padding + (1 - (h.balance - minBal) / range) * (chartHeight - padding * 2);
    return { x, y, epoch: h.epoch, balance: h.balance };
  });

  const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const isPositive = history[history.length - 1].balance >= history[0].balance;
  const strokeColor = isPositive ? '#34D399' : '#F87171';
  const fillColor = isPositive ? '#34D39915' : '#F8717115';

  const fillPoints = `${padding},${chartHeight - padding} ${pathPoints} ${chartWidth - padding},${chartHeight - padding}`;

  const startBalance = history[0].balance;
  const endBalance = history[history.length - 1].balance;
  const change = ((endBalance - startBalance) / startBalance * 100);

  return (
    <div className="bg-[var(--surface-2)] rounded-xl p-4">
      {/* 차트 헤더 */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-[var(--text-primary)]">잔고 추이</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {history.length}개 에포크
          </span>
        </div>
      </div>

      {/* SVG 차트 */}
      <div className="w-full">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20">
          {/* Grid */}
          <g stroke="var(--border)" strokeWidth="0.5" opacity="0.3">
            {gridLines.map((path, i) => (
              <path key={i} d={path} />
            ))}
          </g>
          
          {/* Fill area */}
          <polygon points={fillPoints} fill={fillColor} />
          
          {/* Line */}
          <polyline
            points={pathPoints}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle 
                cx={point.x} 
                cy={point.y} 
                r="2" 
                fill={strokeColor}
                className="hover:r-3 transition-all cursor-pointer"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] font-mono mt-2">
        <span>E{history[0].epoch}: ${startBalance.toFixed(2)}</span>
        <span>E{history[history.length - 1].epoch}: ${endBalance.toFixed(2)}</span>
      </div>
    </div>
  );
}

function MiniTransaction({ tx, agentId }: { tx: { id: string; buyer_id: string; seller_id: string; skill_type: string; amount: number; fee: number; epoch: number; narrative: string | null; created_at: string }; agentId: string }) {
  const isBuyer = tx.buyer_id === agentId;
  const otherName = AGENT_NAMES[isBuyer ? tx.seller_id : tx.buyer_id] || (isBuyer ? tx.seller_id : tx.buyer_id);
  const otherEmoji = AGENT_EMOJI[isBuyer ? tx.seller_id : tx.buyer_id] || '🤖';

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-[var(--surface-2)] rounded-lg">
      <span className="text-sm">{otherEmoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-semibold ${isBuyer ? 'text-red-400' : 'text-emerald-400'}`}>
            {isBuyer ? '구매' : '판매'}
          </span>
          <span className="text-[var(--text-secondary)]">{otherName}</span>
          <span className="px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded text-[10px] font-semibold">
            {tx.skill_type}
          </span>
        </div>
      </div>
      <span className={`font-mono text-xs font-bold ${isBuyer ? 'text-red-400' : 'text-emerald-400'}`}>
        {isBuyer ? '-' : '+'}${tx.amount.toFixed(2)}
      </span>
      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">E{tx.epoch}</span>
    </div>
  );
}
