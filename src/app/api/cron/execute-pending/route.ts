export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStockQuote } from '@/lib/yahoo-finance';
import { computeHoldingsFromTrades } from '@/lib/portfolio';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.pendingOrder.findMany({
    orderBy: { createdAt: 'asc' },
    include: { room: true },
  });

  let executed = 0;
  let cancelled = 0;

  for (const order of orders) {
    const now = new Date();
    if (new Date(order.room.endsAt) <= now) {
      await prisma.pendingOrder.delete({ where: { id: order.id } });
      cancelled++;
      continue;
    }

    const quote = await getStockQuote(order.symbol);
    if (!quote || quote.marketState !== 'REGULAR') continue;

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: order.roomId, userId: order.userId } },
    });
    if (!member) {
      await prisma.pendingOrder.delete({ where: { id: order.id } });
      cancelled++;
      continue;
    }

    const pricePerShare = quote.price;
    const totalValue = pricePerShare * order.quantity;

    if (order.action === 'BUY') {
      if (member.cashBalance < totalValue) {
        await prisma.pendingOrder.delete({ where: { id: order.id } });
        cancelled++;
        continue;
      }

      await prisma.$transaction([
        prisma.trade.create({
          data: {
            roomId: order.roomId,
            userId: order.userId,
            symbol: order.symbol,
            companyName: order.companyName,
            exchange: order.exchange,
            action: 'BUY',
            quantity: order.quantity,
            pricePerShare,
            totalValue,
          },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId: order.roomId, userId: order.userId } },
          data: { cashBalance: { decrement: totalValue } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
      executed++;
    } else {
      const trades = await prisma.trade.findMany({
        where: { roomId: order.roomId, userId: order.userId },
        orderBy: { executedAt: 'asc' },
      });
      const holdings = computeHoldingsFromTrades(trades);
      const holding = holdings.find((h) => h.symbol === order.symbol);

      if (!holding || holding.quantity < order.quantity) {
        await prisma.pendingOrder.delete({ where: { id: order.id } });
        cancelled++;
        continue;
      }

      await prisma.$transaction([
        prisma.trade.create({
          data: {
            roomId: order.roomId,
            userId: order.userId,
            symbol: order.symbol,
            companyName: order.companyName,
            exchange: order.exchange,
            action: 'SELL',
            quantity: order.quantity,
            pricePerShare,
            totalValue,
          },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId: order.roomId, userId: order.userId } },
          data: { cashBalance: { increment: totalValue } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
      executed++;
    }
  }

  return NextResponse.json({ executed, cancelled, skipped: orders.length - executed - cancelled });
}
