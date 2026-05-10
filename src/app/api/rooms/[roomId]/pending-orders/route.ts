export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStockQuote } from '@/lib/yahoo-finance';
import { computeHoldingsFromTrades } from '@/lib/portfolio';
import { symbolToExchange } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.pendingOrder.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  // Try to execute any orders where market is now open
  for (const order of orders) {
    const quote = await getStockQuote(order.symbol);
    if (!quote || quote.marketState !== 'REGULAR') continue;

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
    });
    if (!member) continue;

    const pricePerShare = quote.price;
    const totalValue = pricePerShare * order.quantity;

    if (order.action === 'BUY') {
      if (member.cashBalance < totalValue) {
        await prisma.pendingOrder.delete({ where: { id: order.id } });
        continue;
      }
      await prisma.$transaction([
        prisma.trade.create({
          data: {
            roomId: params.roomId,
            userId: session.user.id,
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
          where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
          data: { cashBalance: { decrement: totalValue } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
    } else {
      const trades = await prisma.trade.findMany({
        where: { roomId: params.roomId, userId: session.user.id },
        orderBy: { executedAt: 'asc' },
      });
      const holdings = computeHoldingsFromTrades(trades);
      const holding = holdings.find((h) => h.symbol === order.symbol);
      if (!holding || holding.quantity < order.quantity) {
        await prisma.pendingOrder.delete({ where: { id: order.id } });
        continue;
      }
      await prisma.$transaction([
        prisma.trade.create({
          data: {
            roomId: params.roomId,
            userId: session.user.id,
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
          where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
          data: { cashBalance: { increment: totalValue } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
    }
  }

  // Return remaining (unexecuted) orders
  const remaining = await prisma.pendingOrder.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(remaining);
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol, companyName, action, quantity } = await req.json();

  if (!symbol || !action || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const qty = Math.floor(Number(quantity));
  if (qty <= 0) return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
  if (!['BUY', 'SELL'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const now = new Date();
  if (new Date(room.endsAt) <= now) return NextResponse.json({ error: 'Room has ended' }, { status: 400 });
  if (new Date(room.startsAt) > now) return NextResponse.json({ error: 'Room has not started yet' }, { status: 400 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  const order = await prisma.pendingOrder.create({
    data: {
      roomId: params.roomId,
      userId: session.user.id,
      symbol,
      companyName: companyName || symbol,
      exchange: symbolToExchange(symbol),
      action,
      quantity: qty,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
