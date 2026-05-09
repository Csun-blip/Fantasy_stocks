import type { StockQuote, StockSearchResult, PriceHistoryPoint } from '@/types';

const BASE1 = 'https://query1.finance.yahoo.com';
const BASE2 = 'https://query2.finance.yahoo.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  Accept: 'application/json',
};

// Simple in-memory price cache (60-second TTL)
const priceCache = new Map<string, { price: StockQuote; timestamp: number }>();
const CACHE_TTL = 60_000;

function getCached(symbol: string): StockQuote | null {
  const entry = priceCache.get(symbol);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.price;
  return null;
}

function setCache(symbol: string, quote: StockQuote) {
  priceCache.set(symbol, { price: quote, timestamp: Date.now() });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function yfFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  return res.json();
}

// Fetch a quote using the chart API (no auth required unlike v7/quote)
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  const cached = getCached(symbol);
  if (cached) return cached;

  try {
    const url = `${BASE2}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const data = await yfFetch(url);
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const prevClose = result.indicators?.quote?.[0]?.close?.[0] ?? meta.previousClose ?? meta.chartPreviousClose;
    const price = meta.regularMarketPrice ?? meta.currentTradingPeriod?.regular?.end;
    if (!price) return null;

    const change = price - (prevClose ?? price);
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    const quote: StockQuote = {
      symbol: meta.symbol,
      name: meta.longName || meta.shortName || symbol,
      price,
      change,
      changePercent,
      exchange: meta.fullExchangeName || meta.exchangeName || '',
      currency: meta.currency || 'EUR',
      marketState: meta.marketState,
      dayHigh: meta.regularMarketDayHigh,
      dayLow: meta.regularMarketDayLow,
      volume: meta.regularMarketVolume,
      previousClose: prevClose,
    };

    setCache(symbol, quote);
    return quote;
  } catch {
    return null;
  }
}

export async function getBatchQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const result = new Map<string, StockQuote>();
  if (symbols.length === 0) return result;

  const toFetch: string[] = [];
  for (const s of symbols) {
    const cached = getCached(s);
    if (cached) result.set(s, cached);
    else toFetch.push(s);
  }

  if (toFetch.length === 0) return result;

  // Fetch in parallel — chart API is per-symbol
  const settled = await Promise.allSettled(toFetch.map((s) => getStockQuote(s)));
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value) {
      result.set(toFetch[i], r.value);
    }
  });

  return result;
}

const GERMAN_EXCHANGES = new Set(['GER', 'MU', 'EBS', 'FRA', 'HAM', 'HAN', 'BER', 'STU', 'DUS']);

function isGermanExchange(symbol: string, exchange: string): boolean {
  return (
    symbol.endsWith('.DE') ||
    symbol.endsWith('.MU') ||
    symbol.endsWith('.F') ||
    GERMAN_EXCHANGES.has(exchange)
  );
}

export async function searchGermanStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const url = `${BASE1}/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=30&newsCount=0&enableFuzzyQuery=false`;
    const data = await yfFetch(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes: any[] = data?.quotes ?? [];

    const securities = quotes.filter(
      (q) => (q.quoteType === 'EQUITY' || q.quoteType === 'ETF') && q.symbol
    );

    // Sort: German exchanges first, then ETFs, then all others
    securities.sort((a, b) => {
      const score = (item: typeof a) => {
        if (isGermanExchange(item.symbol, item.exchange || '')) return 0;
        if (item.quoteType === 'ETF') return 1;
        return 2;
      };
      return score(a) - score(b);
    });

    return securities
      .map((q) => ({
        symbol: q.symbol as string,
        name: (q.longname || q.shortname || q.symbol) as string,
        exchange: (q.exchange || '') as string,
        type: q.quoteType as string,
      }))
      .slice(0, 18);
  } catch {
    return [];
  }
}

export async function getStockHistory(
  symbol: string,
  range: '1w' | '1m' | '3m' | '6m' | '1y' | '5y'
): Promise<PriceHistoryPoint[]> {
  const rangeMap: Record<string, { range: string; interval: string }> = {
    '1w': { range: '5d', interval: '1d' },
    '1m': { range: '1mo', interval: '1d' },
    '3m': { range: '3mo', interval: '1d' },
    '6m': { range: '6mo', interval: '1wk' },
    '1y': { range: '1y', interval: '1wk' },
    '5y': { range: '5y', interval: '1mo' },
  };

  const { range: yfRange, interval } = rangeMap[range] ?? rangeMap['1m'];

  try {
    const url = `${BASE2}/v8/finance/chart/${encodeURIComponent(symbol)}?range=${yfRange}&interval=${interval}&includePrePost=false`;
    const data = await yfFetch(url);
    const chart = data?.chart?.result?.[0];
    if (!chart) return [];

    const timestamps: number[] = chart.timestamp ?? [];
    const closes: number[] = chart.indicators?.quote?.[0]?.close ?? [];
    const opens: number[] = chart.indicators?.quote?.[0]?.open ?? [];
    const highs: number[] = chart.indicators?.quote?.[0]?.high ?? [];
    const lows: number[] = chart.indicators?.quote?.[0]?.low ?? [];
    const volumes: number[] = chart.indicators?.quote?.[0]?.volume ?? [];

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[i] ?? 0,
        open: opens[i] ?? 0,
        high: highs[i] ?? 0,
        low: lows[i] ?? 0,
        volume: volumes[i] ?? 0,
      }))
      .filter((p) => p.close > 0);
  } catch {
    return [];
  }
}
