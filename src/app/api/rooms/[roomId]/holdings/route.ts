export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeHoldingsFromTrades } from '@/lib/portfolio';
import { getBatchQuotes } from '@/lib/yahoo-finance';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  const targetUserId = new URL(req.url).searchParams.get('userId') ?? session.user.id;

  const trades = await prisma.trade.findMany({
    where: { roomId: params.roomId, userId: targetUserId },
    orderBy: { executedAt: 'asc' },
  });

  const rawHoldings = computeHoldingsFromTrades(trades);

  if (rawHoldings.length === 0) {
    return NextResponse.json({ holdings: [] });
  }

  const prices = await getBatchQuotes(rawHoldings.map((h) => h.symbol));

  const holdings = rawHoldings.map((h) => {
    const quote = prices.get(h.symbol);
    const currentPrice = quote?.price ?? h.avgCost;
    const marketValue = currentPrice * h.quantity;
    const gainLoss = marketValue - h.totalCost;
    const gainLossPercent = h.totalCost > 0 ? (gainLoss / h.totalCost) * 100 : 0;
    return {
      symbol: h.symbol,
      companyName: h.companyName,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice,
      marketValue,
      gainLoss,
      gainLossPercent,
    };
  });

  return NextResponse.json({ holdings });
}
