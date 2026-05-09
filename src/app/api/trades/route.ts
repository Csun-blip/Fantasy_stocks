import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStockQuote } from '@/lib/yahoo-finance';
import { computeHoldingsFromTrades } from '@/lib/portfolio';
import { symbolToExchange } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { roomId, symbol, action, quantity } = await req.json();

  if (!roomId || !symbol || !action || !quantity) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const qty = Math.floor(Number(quantity));
  if (qty <= 0) return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
  if (!['BUY', 'SELL'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (new Date(room.endsAt) <= new Date()) return NextResponse.json({ error: 'Room has ended' }, { status: 400 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  // Get live price
  const quote = await getStockQuote(symbol);
  if (!quote) return NextResponse.json({ error: 'Could not fetch stock price' }, { status: 503 });

  const pricePerShare = quote.price;
  const totalValue = pricePerShare * qty;

  if (action === 'BUY') {
    if (member.cashBalance < totalValue) {
      return NextResponse.json({ error: `Insufficient funds. Need ${totalValue.toFixed(2)} EUR, have ${member.cashBalance.toFixed(2)} EUR` }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.trade.create({
        data: {
          roomId,
          userId: session.user.id,
          symbol,
          companyName: quote.name,
          exchange: symbolToExchange(symbol),
          action: 'BUY',
          quantity: qty,
          pricePerShare,
          totalValue,
        },
      }),
      prisma.roomMember.update({
        where: { roomId_userId: { roomId, userId: session.user.id } },
        data: { cashBalance: { decrement: totalValue } },
      }),
    ]);
  } else {
    // SELL
    const trades = await prisma.trade.findMany({
      where: { roomId, userId: session.user.id },
      orderBy: { executedAt: 'asc' },
    });

    const holdings = computeHoldingsFromTrades(trades);
    const holding = holdings.find((h) => h.symbol === symbol);
    const ownedQty = holding?.quantity ?? 0;

    if (ownedQty < qty) {
      return NextResponse.json({ error: `You only own ${ownedQty} shares of ${symbol}` }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.trade.create({
        data: {
          roomId,
          userId: session.user.id,
          symbol,
          companyName: quote.name,
          exchange: symbolToExchange(symbol),
          action: 'SELL',
          quantity: qty,
          pricePerShare,
          totalValue,
        },
      }),
      prisma.roomMember.update({
        where: { roomId_userId: { roomId, userId: session.user.id } },
        data: { cashBalance: { increment: totalValue } },
      }),
    ]);
  }

  const updatedMember = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: session.user.id } },
  });

  return NextResponse.json({
    success: true,
    action,
    symbol,
    quantity: qty,
    pricePerShare,
    totalValue,
    newCashBalance: updatedMember?.cashBalance,
  });
}
