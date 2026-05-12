'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatPercent } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { LeaderboardEntry } from '@/types';

interface HoldingRow {
  symbol: string;
  companyName: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}


function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-mono text-muted w-8 text-center">#{rank}</span>;
}

// ── Player trades modal ──────────────────────────────────────────────────────

function PlayerModal({
  entry,
  roomId,
  onClose,
}: {
  entry: LeaderboardEntry;
  roomId: string;
  onClose: () => void;
}) {
  const { format } = useCurrency();
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/holdings?userId=${entry.userId}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setHoldings(d.holdings ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [entry.userId, roomId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const modal = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg bg-background border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Medal rank={entry.rank} />
              <h2 className="font-bold text-foreground text-lg">{entry.displayName}</h2>
              {entry.isCurrentUser && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">you</span>
              )}
            </div>
            <p className="text-xs text-muted">{entry.tradeCount} trade{entry.tradeCount !== 1 ? 's' : ''} · open positions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 p-5 border-b border-border shrink-0">
          <div className="bg-surface-raised rounded-xl p-3 text-center">
            <p className="font-mono font-bold text-foreground text-sm">{format(entry.totalValue)}</p>
            <p className="text-[10px] text-muted mt-0.5">Portfolio</p>
          </div>
          <div className={`bg-surface-raised rounded-xl p-3 text-center`}>
            <p className={`font-mono font-bold text-sm ${entry.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {entry.returnPercent >= 0 ? '+' : ''}{formatPercent(entry.returnPercent)}
            </p>
            <p className="text-[10px] text-muted mt-0.5">Return %</p>
          </div>
          <div className="bg-surface-raised rounded-xl p-3 text-center">
            <p className={`font-mono font-bold text-sm ${entry.returnAmount >= 0 ? 'text-success' : 'text-danger'}`}>
              {entry.returnAmount >= 0 ? '+' : ''}{format(entry.returnAmount)}
            </p>
            <p className="text-[10px] text-muted mt-0.5">P&L</p>
          </div>
        </div>

        {/* Holdings list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <LoadingSpinner className="py-10" />
          ) : holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted text-sm">No open positions</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {holdings.map((h) => {
                const color = h.gainLoss > 0 ? 'text-success' : h.gainLoss < 0 ? 'text-danger' : 'text-muted';
                const sign = h.gainLoss > 0 ? '+' : '';
                return (
                  <div key={h.symbol} className="flex items-center justify-between px-5 py-3 hover:bg-surface-raised/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                        <span className="font-mono font-black text-[10px] text-foreground">{h.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-foreground text-sm">{h.symbol}</p>
                        <p className="text-muted text-[10px] truncate max-w-[140px]">{h.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-mono font-semibold text-foreground text-sm">{format(h.marketValue)}</p>
                      <p className={`font-mono text-[10px] ${color}`}>
                        {sign}{format(h.gainLoss)} ({sign}{h.gainLossPercent.toFixed(2)}%)
                      </p>
                      <p className="text-muted text-[10px]">{h.quantity} shares @ {format(h.avgCost)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Main leaderboard ─────────────────────────────────────────────────────────

export default function Leaderboard({ roomId }: { roomId: string }) {
  const { format } = useCurrency();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaderboardEntry | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);

  if (loading) return <LoadingSpinner className="py-12" />;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-sm">No players yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <button
            key={entry.userId}
            onClick={() => setSelected(entry)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left cursor-pointer group ${
              entry.isCurrentUser
                ? 'bg-primary/10 border-primary/40 hover:border-primary/70'
                : 'bg-surface-raised border-border hover:border-primary/40 hover:bg-surface-raised'
            }`}
          >
            <div className="flex items-center justify-center w-8 shrink-0">
              <Medal rank={entry.rank} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                  {entry.displayName}
                </p>
                {entry.isCurrentUser && (
                  <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full border border-primary/30">you</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-xs text-muted">{entry.tradeCount} trade{entry.tradeCount !== 1 ? 's' : ''}</p>
                <p className={`font-mono text-xs font-semibold sm:hidden ${entry.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {entry.returnPercent >= 0 ? '+' : ''}{formatPercent(entry.returnPercent)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="font-mono font-semibold text-foreground text-sm">{format(entry.totalValue)}</p>
                <p className={`font-mono text-xs mt-0.5 ${entry.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPercent(entry.returnPercent)} ({entry.returnPercent >= 0 ? '+' : ''}{format(entry.returnAmount)})
                </p>
              </div>
              <div className="text-right sm:hidden">
                <p className="font-mono font-semibold text-foreground text-sm">{format(entry.totalValue)}</p>
              </div>
              {/* Chevron hint */}
              <svg className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {mounted && selected && (
        <PlayerModal
          entry={selected}
          roomId={roomId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
