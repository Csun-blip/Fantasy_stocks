export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPortfolioSummary, computeHoldingsFromTrades } from '@/lib/portfolio';
import { getStockQuote } from '@/lib/yahoo-finance';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
    include: { room: { select: { startingCash: true } } },
  });

  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  const [trades, pendingOrders, stopLosses] = await Promise.all([
    prisma.trade.findMany({
      where: { roomId: params.roomId, userId: session.user.id },
      orderBy: { executedAt: 'asc' },
    }),
    prisma.pendingOrder.findMany({
      where: { roomId: params.roomId, userId: session.user.id, action: 'BUY' },
      select: { reservedAmount: true },
    }),
    prisma.stopLossOrder.findMany({
      where: { roomId: params.roomId, userId: session.user.id },
    }),
  ]);

  // Check and execute triggered stop losses
  if (stopLosses.length > 0) {
    const holdings = computeHoldingsFromTrades(trades);
    for (const sl of stopLosses) {
      const quote = await getStockQuote(sl.symbol);
      if (!quote) continue;
      if (quote.price > sl.triggerPrice) continue; // not triggered

      const holding = holdings.find((h) => h.symbol === sl.symbol);
      const availableQty = holding?.quantity ?? 0;
      const sellQty = Math.min(sl.quantity, availableQty);
      if (sellQty <= 0) {
        await prisma.stopLossOrder.delete({ where: { id: sl.id } });
        continue;
      }

      const proceeds = quote.price * sellQty;
      await prisma.$transaction([
        prisma.trade.create({
          data: {
            roomId: params.roomId,
            userId: session.user.id,
            symbol: sl.symbol,
            companyName: sl.companyName,
            exchange: sl.exchange,
            action: 'SELL',
            quantity: sellQty,
            pricePerShare: quote.price,
            totalValue: proceeds,
          },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
          data: { cashBalance: { increment: proceeds } },
        }),
        prisma.stopLossOrder.delete({ where: { id: sl.id } }),
      ]);
    }
  }

  // Re-fetch after potential executions
  const [freshTrades, freshMember] = await Promise.all([
    prisma.trade.findMany({
      where: { roomId: params.roomId, userId: session.user.id },
      orderBy: { executedAt: 'asc' },
    }),
    prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
    }),
  ]);

  const reservedCash = pendingOrders.reduce((sum, o) => sum + o.reservedAmount, 0);
  const summary = await buildPortfolioSummary(
    freshTrades,
    freshMember?.cashBalance ?? member.cashBalance,
    member.room.startingCash,
    reservedCash
  );

  return NextResponse.json(summary);
}
