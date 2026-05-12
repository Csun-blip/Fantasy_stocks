'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RoomNav from '@/components/room/RoomNav';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/context/CurrencyContext';

interface TradeActivity {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  action: string;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  executedAt: string;
  player: {
    userId: string;
    displayName: string;
    isCurrentUser: boolean;
  };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ActivityPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { format } = useCurrency();
  const [activity, setActivity] = useState<TradeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActivity = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}/activity`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setActivity(data.activity ?? []);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const visible = filter === 'mine' ? activity.filter((t) => t.player.isCurrentUser) : activity;

  const buyCount = visible.filter((t) => t.action === 'BUY').length;
  const sellCount = visible.filter((t) => t.action === 'SELL').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href={`/rooms/${roomId}`} className="hover:text-foreground transition-colors">← Back to Room</Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Room Activity</h1>
      <RoomNav roomId={roomId} isMember={true} />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-foreground">{activity.length}</p>
          <p className="text-xs text-muted mt-0.5">Total Trades</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-success">{buyCount}</p>
          <p className="text-xs text-muted mt-0.5">Buys</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold font-mono text-danger">{sellCount}</p>
          <p className="text-xs text-muted mt-0.5">Sells</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <h2 className="font-semibold text-foreground">Live Feed</h2>
            {lastUpdated && (
              <span className="text-xs text-muted hidden sm:inline">
                · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-xl p-1">
            {(['all', 'mine'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-surface text-foreground shadow-sm border border-border'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All Players' : 'My Trades'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner className="py-16" />
        ) : visible.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-foreground font-medium">
              {filter === 'mine' ? 'You have no trades yet' : 'No trades yet'}
            </p>
            <p className="text-muted text-sm mt-1">
              {filter === 'mine' ? 'Head to the Trade tab to make your first trade.' : 'Trades will appear here as players buy and sell.'}
            </p>
            {filter === 'mine' && (
              <Link
                href={`/rooms/${roomId}/trade`}
                className="inline-block mt-4 text-sm bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl transition-colors"
              >
                Start Trading
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/50">
                    <th className="text-left text-muted font-medium py-3 px-4 text-xs">Time</th>
                    <th className="text-left text-muted font-medium py-3 px-4 text-xs">Player</th>
                    <th className="text-left text-muted font-medium py-3 px-4 text-xs">Action</th>
                    <th className="text-left text-muted font-medium py-3 px-4 text-xs">Stock</th>
                    <th className="text-right text-muted font-medium py-3 px-4 text-xs">Qty</th>
                    <th className="text-right text-muted font-medium py-3 px-4 text-xs">Price</th>
                    <th className="text-right text-muted font-medium py-3 px-4 text-xs">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-border/40 transition-colors ${
                        t.player.isCurrentUser ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-surface-raised/50'
                      }`}
                    >
                      <td className="py-3 px-4 text-muted text-xs whitespace-nowrap">{timeAgo(t.executedAt)}</td>
                      <td className="py-3 px-4">
                        <span className={`text-sm font-medium ${t.player.isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                          {t.player.displayName}
                          {t.player.isCurrentUser && <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full border border-primary/30">you</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          t.action === 'BUY' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                        }`}>
                          {t.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono font-semibold text-foreground text-xs">{t.symbol}</p>
                        <p className="text-muted text-[10px] truncate max-w-[140px]">{t.companyName}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-foreground text-xs">{t.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-muted text-xs">{format(t.pricePerShare)}</td>
                      <td className={`py-3 px-4 text-right font-mono font-semibold text-xs ${
                        t.action === 'BUY' ? 'text-danger' : 'text-success'
                      }`}>
                        {t.action === 'BUY' ? '-' : '+'}{format(t.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-border/50">
              {visible.map((t) => (
                <div
                  key={t.id}
                  className={`px-4 py-3 ${t.player.isCurrentUser ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                        t.action === 'BUY' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                      }`}>
                        {t.action}
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-foreground text-xs">{t.symbol}</p>
                        <p className="text-muted text-[10px] truncate">{t.companyName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono font-semibold text-xs ${t.action === 'BUY' ? 'text-danger' : 'text-success'}`}>
                        {t.action === 'BUY' ? '-' : '+'}{format(t.totalValue)}
                      </p>
                      <p className="text-muted text-[10px]">{t.quantity} × {format(t.pricePerShare)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-xs font-medium ${t.player.isCurrentUser ? 'text-primary' : 'text-muted-bright'}`}>
                      {t.player.displayName}
                      {t.player.isCurrentUser && <span className="ml-1 text-[10px] text-primary opacity-70">(you)</span>}
                    </span>
                    <span className="text-[10px] text-muted">{timeAgo(t.executedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
