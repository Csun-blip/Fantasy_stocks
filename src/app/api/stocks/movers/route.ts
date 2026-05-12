export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getBatchQuotes } from '@/lib/yahoo-finance';
import type { StockQuote } from '@/types';

const WATCHLIST = [
  // US large-cap
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM', 'V', 'WMT',
  'XOM', 'UNH', 'PG', 'JNJ', 'MA', 'HD', 'AVGO', 'LLY', 'ORCL', 'AMD',
  // German blue-chips
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'MUV2.DE', 'BAS.DE', 'BAYN.DE', 'DTE.DE',
  'VOW3.DE', 'BMW.DE', 'ADS.DE', 'MBG.DE', 'DB1.DE', 'RWE.DE', 'BEI.DE',
  // ETFs
  'SPY', 'QQQ',
];

type MoversData = { gainers: StockQuote[]; losers: StockQuote[]; updatedAt: string };
let moversCache: { data: MoversData; ts: number } | null = null;
const CACHE_TTL = 60_000;

async function buildMovers(): Promise<MoversData> {
  const quotes = await getBatchQuotes(WATCHLIST);
  const list = Array.from(quotes.values()).filter((q) => q.changePercent !== 0);
  list.sort((a, b) => b.changePercent - a.changePercent);
  const gainers = list.filter((q) => q.changePercent > 0).slice(0, 10);
  const losers = list
    .filter((q) => q.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 10);
  return { gainers, losers, updatedAt: new Date().toISOString() };
}

export async function GET() {
  if (moversCache && Date.now() - moversCache.ts < CACHE_TTL) {
    return NextResponse.json(moversCache.data);
  }
  const data = await buildMovers();
  moversCache = { data, ts: Date.now() };
  return NextResponse.json(data);
}
