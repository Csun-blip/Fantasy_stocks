export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import type { StockQuote } from '@/types';

const YF_BASE = 'https://query1.finance.yahoo.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  Accept: 'application/json',
};

type MoversData = { gainers: StockQuote[]; losers: StockQuote[]; updatedAt: string };
let moversCache: { data: MoversData; ts: number } | null = null;
const CACHE_TTL = 50_000; // 50s — shorter than the 60s client poll so every poll gets fresh data

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuote(q: any): StockQuote {
  return {
    symbol: q.symbol,
    name: q.longName || q.shortName || q.symbol,
    price: q.regularMarketPrice ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    exchange: q.fullExchangeName || q.exchange || '',
    currency: q.currency || 'USD',
    marketState: q.marketState,
    dayHigh: q.regularMarketDayHigh,
    dayLow: q.regularMarketDayLow,
    volume: q.regularMarketVolume,
    previousClose: q.regularMarketPreviousClose,
  };
}

async function fetchScreener(scrId: 'day_gainers' | 'day_losers', count = 10): Promise<StockQuote[]> {
  const url = `${YF_BASE}/v1/finance/screener/predefined/saved?formatted=false&scrIds=${scrId}&count=${count}&start=0`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Yahoo screener (${scrId}) returned ${res.status}`);
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotes: any[] = data?.finance?.result?.[0]?.quotes ?? [];
  return quotes.map(mapQuote);
}

async function buildMovers(): Promise<MoversData> {
  const [gainers, losers] = await Promise.all([
    fetchScreener('day_gainers', 10),
    fetchScreener('day_losers', 10),
  ]);
  return { gainers, losers, updatedAt: new Date().toISOString() };
}

export async function GET() {
  if (moversCache && Date.now() - moversCache.ts < CACHE_TTL) {
    return NextResponse.json(moversCache.data);
  }
  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  try {
    const data = await buildMovers();
    moversCache = { data, ts: Date.now() };
    return NextResponse.json(data, { headers });
  } catch {
    if (moversCache) return NextResponse.json(moversCache.data, { headers });
    return NextResponse.json({ gainers: [], losers: [], updatedAt: new Date().toISOString() }, { headers });
  }
}
