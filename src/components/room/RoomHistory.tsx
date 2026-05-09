'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface TopStock {
  symbol: string;
  companyName: string;
  totalTrades: number;
  totalVolume: number;
  netQuantity: number;
}

interface RoomHistoryData {
  leaderboard: LeaderboardEntry[];
  topStocks: TopStock[];
}

export default function RoomHistory({ roomId }: { roomId: string }) {
  const [data, setData] = useState<RoomHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/leaderboard`)
      .then((r) => r.json())
      .then((d) => { setData({ leaderboard: d.leaderboard ?? [], topStocks: d.topStocks ?? [] }); })
      .finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="space-y-3 py-6">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return <p className="text-muted-bright text-sm py-6 text-center">No participants recorded.</p>;
  }

  const winner = data.leaderboard[0];
  const rest = data.leaderboard.slice(1);

  return (
    <div className="space-y-6">
      {/* Winner banner */}
      <div className="relative overflow-hidden rounded-2xl winner-glow border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-surface p-6">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-5 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-gold w-full h-full">
            <text x="50" y="75" fontSize="80" textAnchor="middle">🏆</text>
          </svg>
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">Champion</p>
        <h2 className="text-3xl font-bold text-foreground mb-1">{winner.displayName}</h2>
        <div className="flex flex-wrap gap-4 mt-3">
          <div>
            <p className="text-xs text-muted-bright mb-0.5">Final Portfolio</p>
            <p className="font-mono text-xl font-bold text-foreground">{formatCurrency(winner.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-bright mb-0.5">Total Return</p>
            <p className={`font-mono text-xl font-bold ${winner.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              {winner.returnPercent >= 0 ? '+' : ''}{formatPercent(winner.returnPercent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-bright mb-0.5">Profit / Loss</p>
            <p className={`font-mono text-xl font-bold ${winner.returnAmount >= 0 ? 'text-success' : 'text-danger'}`}>
              {winner.returnAmount >= 0 ? '+' : ''}{formatCurrency(winner.returnAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-bright mb-0.5">Trades</p>
            <p className="font-mono text-xl font-bold text-foreground">{winner.tradeCount}</p>
          </div>
        </div>
      </div>

      {/* Final leaderboard */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Final Standings</h3>
        </div>
        <div className="divide-y divide-border">
          {data.leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 px-5 py-3.5 ${entry.isCurrentUser ? 'bg-primary/5' : ''}`}
            >
              <div className={`w-8 text-center font-bold text-sm shrink-0 ${
                entry.rank === 1 ? 'rank-1 text-base' : entry.rank === 2 ? 'rank-2' : entry.rank === 3 ? 'rank-3' : 'text-muted-bright'
              }`}>
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {entry.displayName}{entry.isCurrentUser && <span className="ml-1.5 text-xs text-primary font-normal">(you)</span>}
                </p>
                <p className="text-xs text-muted-bright">{entry.tradeCount} trades</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-sm font-semibold text-foreground">{formatCurrency(entry.totalValue)}</p>
                <p className={`font-mono text-xs ${entry.returnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {entry.returnPercent >= 0 ? '+' : ''}{formatPercent(entry.returnPercent)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top stocks */}
      {data.topStocks.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Most Traded Stocks</h3>
          </div>
          <div className="divide-y divide-border">
            {data.topStocks.map((stock, i) => (
              <div key={stock.symbol} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xs font-bold text-muted-bright w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-foreground">{stock.symbol}</p>
                  <p className="text-xs text-muted-bright truncate">{stock.companyName}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs text-muted-bright">{stock.totalTrades} trade{stock.totalTrades !== 1 ? 's' : ''}</p>
                  <p className="font-mono text-xs text-foreground">{formatCurrency(stock.totalVolume)} volume</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
