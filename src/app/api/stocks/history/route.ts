import { NextRequest, NextResponse } from 'next/server';
import { getStockHistory } from '@/lib/yahoo-finance';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const range = (searchParams.get('range') ?? '1m') as '1w' | '1m' | '3m' | '6m' | '1y' | '5y';

  if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });

  const history = await getStockHistory(symbol, range);
  return NextResponse.json(history);
}
