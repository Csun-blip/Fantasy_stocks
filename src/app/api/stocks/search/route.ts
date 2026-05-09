export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { searchGermanStocks } from '@/lib/yahoo-finance';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';

  if (q.length < 2) return NextResponse.json([]);

  const results = await searchGermanStocks(q);
  return NextResponse.json(results);
}
