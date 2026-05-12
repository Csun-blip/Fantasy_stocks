'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import type { StockQuote } from '@/types';

const REFRESH_SEC = 60;

interface MoversData {
  gainers: StockQuote[];
  losers: StockQuote[];
  updatedAt: string;
}

export default function MarketMovers() {
  const { format } = useCurrency();
  const [data, setData] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_SEC);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(REFRESH_SEC);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 0));
    }, 1000);
  }, []);

  const fetchMovers = useCallback(async (initial = false) => {
    if (!initial) setRefreshing(true);
    try {
      // cache: 'no-store' prevents browser from returning a stale cached response
      const res = await fetch('/api/stocks/movers', { cache: 'no-store' });
      if (res.ok) {
        const json: MoversData = await res.json();
        setData(json);
        setLastUpdated(new Date());
        startCountdown();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startCountdown]);

  useEffect(() => {
    fetchMovers(true);
    const poll = setInterval(() => fetchMovers(false), REFRESH_SEC * 1000);
    return () => {
      clearInterval(poll);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [fetchMovers]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">Market Movers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 skeleton rounded-lg w-28" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-10 skeleton rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progressPct = (countdown / REFRESH_SEC) * 100;

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      {/* Progress bar — drains to zero then refills on each fetch */}
      <div className="h-0.5 bg-border w-full">
        <div
          className="h-full bg-primary/50 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-warning animate-pulse' : 'bg-success animate-pulse'}`} />
            <h2 className="text-lg font-semibold text-foreground">Market Movers</h2>
            <span className="text-xs text-muted">Today</span>
          </div>

          <div className="flex items-center gap-3">
            {refreshing ? (
              <span className="text-xs text-warning animate-pulse">Refreshing...</span>
            ) : (
              <span className="text-xs text-muted tabular-nums">
                {lastUpdated && (
                  <>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · </>
                )}
                <span className="text-primary font-medium">{countdown}s</span>
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MoverTable title="Top Gainers" rows={data.gainers} format={format} type="gainer" />
          <MoverTable title="Top Losers" rows={data.losers} format={format} type="loser" />
        </div>
      </div>
    </div>
  );
}

function MoverTable({
  title,
  rows,
  format,
  type,
}: {
  title: string;
  rows: StockQuote[];
  format: (n: number) => string;
  type: 'gainer' | 'loser';
}) {
  const accent = type === 'gainer' ? 'text-success' : 'text-danger';
  const headerBg = type === 'gainer' ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20';
  const headerText = type === 'gainer' ? 'text-success' : 'text-danger';

  return (
    <div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-3 ${headerBg} w-fit`}>
        <span className="text-sm">{type === 'gainer' ? '▲' : '▼'}</span>
        <span className={`text-sm font-semibold ${headerText}`}>{title}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted font-medium py-2 px-1 text-xs w-5">#</th>
              <th className="text-left text-muted font-medium py-2 px-2 text-xs">Symbol</th>
              <th className="text-right text-muted font-medium py-2 px-2 text-xs">Price</th>
              <th className="text-right text-muted font-medium py-2 px-2 text-xs hidden sm:table-cell">Change</th>
              <th className="text-right text-muted font-medium py-2 px-2 text-xs">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q, i) => (
              <tr key={q.symbol} className="border-b border-border/40 hover:bg-surface-raised/50 transition-colors">
                <td className="py-2.5 px-1 text-muted text-xs">{i + 1}</td>
                <td className="py-2.5 px-2">
                  <p className="font-mono font-semibold text-foreground text-xs">{q.symbol}</p>
                  <p className="text-muted text-[10px] truncate max-w-[90px]">{q.name}</p>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-foreground text-xs">
                  {format(q.price)}
                </td>
                <td className={`py-2.5 px-2 text-right font-mono text-xs hidden sm:table-cell ${accent}`}>
                  {q.change >= 0 ? '+' : ''}{format(q.change)}
                </td>
                <td className={`py-2.5 px-2 text-right font-mono font-semibold text-xs ${accent}`}>
                  {q.changePercent >= 0 ? '+' : ''}{q.changePercent.toFixed(2)}%
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted text-xs py-6">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
