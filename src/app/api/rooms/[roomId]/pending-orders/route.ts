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

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  const roomStarted = room && new Date(room.startsAt) <= new Date();

  const orders = await prisma.pendingOrder.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  // Execute any orders where the market is now open and the room has started
  for (const order of orders) {
    if (!roomStarted) continue;
    const quote = await getStockQuote(order.symbol);
    if (!quote || quote.marketState !== 'REGULAR') continue;

    const member = await prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
    });
    if (!member) continue;

    const actualPrice = quote.price;
    const actualCost = actualPrice * order.quantity;

    if (order.action === 'BUY') {
      // Cash was already reserved. Adjust for price difference.
      const priceDiff = actualCost - order.reservedAmount;

      if (priceDiff > 0 && member.cashBalance < priceDiff) {
        // Price went up and user can't cover the difference — cancel and refund reservation
        await prisma.$transaction([
          prisma.roomMember.update({
            where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
            data: { cashBalance: { increment: order.reservedAmount } },
          }),
          prisma.pendingOrder.delete({ where: { id: order.id } }),
        ]);
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
            pricePerShare: actualPrice,
            totalValue: actualCost,
          },
        }),
        // Adjust cash: deduct extra if price rose, refund if price dropped
        prisma.roomMember.update({
          where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
          data: { cashBalance: { decrement: priceDiff } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
    } else {
      // SELL — check shares still available
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
            pricePerShare: actualPrice,
            totalValue: actualCost,
          },
        }),
        prisma.roomMember.update({
          where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
          data: { cashBalance: { increment: actualCost } },
        }),
        prisma.pendingOrder.delete({ where: { id: order.id } }),
      ]);
    }
  }

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

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  // Fetch current (last known) price for reservation
  const quote = await getStockQuote(symbol);
  if (!quote) return NextResponse.json({ error: 'Could not fetch stock price' }, { status: 503 });

  const reservedPrice = quote.price;
  const reservedAmount = action === 'BUY' ? reservedPrice * qty : 0;

  if (action === 'BUY') {
    if (member.cashBalance < reservedAmount) {
      return NextResponse.json(
        { error: `Insufficient funds. Need ${reservedAmount.toFixed(2)}, have ${member.cashBalance.toFixed(2)}` },
        { status: 400 }
      );
    }
  } else {
    // SELL — validate shares exist
    const trades = await prisma.trade.findMany({
      where: { roomId: params.roomId, userId: session.user.id },
      orderBy: { executedAt: 'asc' },
    });
    const holdings = computeHoldingsFromTrades(trades);
    const holding = holdings.find((h) => h.symbol === symbol);
    if (!holding || holding.quantity < qty) {
      return NextResponse.json(
        { error: `You only own ${holding?.quantity ?? 0} shares of ${symbol}` },
        { status: 400 }
      );
    }
  }

  let newCashBalance = member.cashBalance;

  const order = await prisma.$transaction(async (tx) => {
    if (action === 'BUY') {
      const updated = await tx.roomMember.update({
        where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
        data: { cashBalance: { decrement: reservedAmount } },
      });
      newCashBalance = updated.cashBalance;
    }

    return tx.pendingOrder.create({
      data: {
        roomId: params.roomId,
        userId: session.user.id,
        symbol,
        companyName: companyName || symbol,
        exchange: symbolToExchange(symbol),
        action,
        quantity: qty,
        reservedAmount,
        reservedPrice,
      },
    });
  });

  return NextResponse.json({ order, newCashBalance }, { status: 201 });
}
