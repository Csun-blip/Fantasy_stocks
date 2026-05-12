'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useCurrency } from '@/context/CurrencyContext';
import type { PriceHistoryPoint } from '@/types';

const RANGES = [
  { value: '1w', label: '1W' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '5y', label: '5Y' },
] as const;

interface PriceChartProps {
  symbol: string;
}

export default function PriceChart({ symbol }: PriceChartProps) {
  const { format, currencyConfig } = useCurrency();
  const [range, setRange] = useState<'1w' | '1m' | '3m' | '6m' | '1y' | '5y'>('1m');
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [symbol, range]);

  const firstPrice = data[0]?.close ?? 0;
  const lastPrice = data[data.length - 1]?.close ?? 0;
  const isPositive = lastPrice >= firstPrice;
  const color = isPositive ? '#10b981' : '#ef4444';

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    if (range === '1w') return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
    if (range === '1m' || range === '3m') return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
    return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">Price History</p>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                range === r.value ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 skeleton rounded-xl" />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted text-sm">No data available</div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v) => `${currencyConfig.symbol}${v.toFixed(0)}`}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{ background: '#0f1923', border: '1px solid #1e2d45', borderRadius: '12px', color: '#fff' }}
                formatter={(v: number) => [format(v), 'Price']}
                labelFormatter={(l) => new Date(l).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
              {firstPrice > 0 && <ReferenceLine y={firstPrice} stroke="#1e2d45" strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="close" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
