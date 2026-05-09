'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { LeaderboardEntry } from '@/types';

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-mono text-muted w-8 text-center">#{rank}</span>;
}

export default function Leaderboard({ roomId }: { roomId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLeaderboard() {
    try {
      const res = await fetch(`/api/rooms/${roomId}/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.leaderboard);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, [roomId]);

  if (loading) return <LoadingSpinner className="py-12" />;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-sm">No players yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <div
          key={entry.userId}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
            entry.isCurrentUser
              ? 'bg-primary/10 border-primary/40'
              : 'bg-surface-raised border-border hover:border-border'
          }`}
        >
          <div className="flex items-center justify-center w-10 shrink-0">
            <Medal rank={entry.rank} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground truncate">{entry.displayName}</p>
              {entry.isCurrentUser && (
                <span className="text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full border border-primary/30">you</span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{entry.tradeCount} trade{entry.tradeCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-mono font-semibold text-foreground">{formatCurrency(entry.totalValue)}</p>
            <p className={`font-mono text-xs mt-0.5 ${entry.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatPercent(entry.returnPercent)} ({entry.returnPercent >= 0 ? '+' : ''}{formatCurrency(entry.returnAmount)})
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
