'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import type { StockQuote } from '@/types';

interface MoversData {
  gainers: StockQuote[];
  losers: StockQuote[];
  updatedAt: string;
}

export default function MarketMovers() {
  const { format } = useCurrency();
  const [data, setData] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function fetchMovers() {
    try {
      const res = await fetch('/api/stocks/movers');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 60_000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h2 className="text-lg font-semibold text-foreground">Market Movers</h2>
          <span className="text-xs text-muted">Today</span>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted">
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MoverTable title="Top Gainers" rows={data.gainers} format={format} type="gainer" />
        <MoverTable title="Top Losers" rows={data.losers} format={format} type="loser" />
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
