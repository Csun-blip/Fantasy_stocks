'use client';

import { useState, useEffect, useRef } from 'react';
import type { StockSearchResult } from '@/types';

interface StockSearchProps {
  onSelect: (stock: StockSearchResult) => void;
}

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'ETF', value: 'ETF' },
  { label: 'Xetra (.DE)', value: '.DE' },
  { label: 'Gettex (.MU)', value: '.MU' },
  { label: 'Frankfurt (.F)', value: '.F' },
];

function matchesFilter(stock: StockSearchResult, filter: string): boolean {
  if (!filter) return true;
  if (filter === 'ETF') return stock.type === 'ETF';
  return stock.symbol.endsWith(filter);
}

function typeLabel(stock: StockSearchResult) {
  if (stock.type === 'ETF') return { label: 'ETF', color: 'text-gold-bright' };
  if (stock.symbol.endsWith('.DE') || stock.exchange === 'GER') return { label: 'Xetra', color: 'text-primary-light' };
  if (stock.symbol.endsWith('.MU') || stock.exchange === 'MU') return { label: 'Gettex', color: 'text-success' };
  if (stock.symbol.endsWith('.F') || stock.exchange === 'FRA') return { label: 'Frankfurt', color: 'text-warning' };
  if (['NMS', 'NGM', 'NYQ', 'PCX', 'ASE'].includes(stock.exchange)) return { label: 'US', color: 'text-yellow-400' };
  return { label: stock.exchange || stock.symbol.split('.').pop() || '', color: 'text-muted-bright' };
}

export default function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [allResults, setAllResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setAllResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        const data: StockSearchResult[] = await res.json();
        setAllResults(data);
        const filtered = data.filter((s) => matchesFilter(s, filter));
        setResults(filtered);
        setOpen(filtered.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, filter]);

  // Re-filter when user changes filter without re-fetching
  useEffect(() => {
    if (allResults.length === 0) return;
    const filtered = allResults.filter((s) => matchesFilter(s, filter));
    setResults(filtered);
    setOpen(filtered.length > 0);
  }, [filter, allResults]);

  function handleSelect(stock: StockSearchResult) {
    onSelect(stock);
    setQuery('');
    setResults([]);
    setAllResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
              filter === f.value
                ? f.value === 'ETF'
                  ? 'bg-gold/20 border-gold/50 text-gold-bright'
                  : 'bg-primary border-primary text-white'
                : 'bg-surface-raised border-border text-muted-bright hover:text-foreground hover:border-border-bright'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stocks & ETFs… (e.g. SPY, BMW, S&P 500)"
          className="w-full bg-surface-raised border border-border rounded-xl px-4 py-3 pl-10 text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        <svg className="absolute left-3 top-3.5 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-3.5">
            <svg className="animate-spin w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
          {results.map((stock) => {
            const tag = typeLabel(stock);
            const isEtf = stock.type === 'ETF';
            return (
              <button
                key={stock.symbol}
                onMouseDown={() => handleSelect(stock)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-raised transition-colors text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">{stock.symbol}</span>
                    {isEtf && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-gold-bright leading-none">
                        ETF
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-bright mt-0.5 line-clamp-1">{stock.name}</p>
                </div>
                <span className={`text-xs font-medium shrink-0 ml-3 ${tag.color}`}>{tag.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
