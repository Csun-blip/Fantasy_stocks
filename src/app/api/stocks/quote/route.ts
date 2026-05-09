export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/yahoo-finance';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  const quote = await getStockQuote(symbol);
  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

  return NextResponse.json(quote);
}
