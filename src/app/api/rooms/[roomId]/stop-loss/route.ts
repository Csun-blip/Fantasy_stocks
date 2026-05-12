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

  const orders = await prisma.stopLossOrder.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol, companyName, quantity, triggerPrice } = await req.json();

  if (!symbol || !quantity || !triggerPrice) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const qty = Math.floor(Number(quantity));
  const trigger = Number(triggerPrice);

  if (qty <= 0) return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
  if (trigger <= 0) return NextResponse.json({ error: 'Trigger price must be positive' }, { status: 400 });

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (new Date(room.endsAt) <= new Date()) {
    return NextResponse.json({ error: 'Room has ended' }, { status: 400 });
  }

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  // Upsert: one stop loss per symbol per user per room
  const order = await prisma.stopLossOrder.upsert({
    where: {
      roomId_userId_symbol: { roomId: params.roomId, userId: session.user.id, symbol },
    },
    update: { quantity: qty, triggerPrice: trigger, companyName: companyName || symbol },
    create: {
      roomId: params.roomId,
      userId: session.user.id,
      symbol,
      companyName: companyName || symbol,
      exchange: symbolToExchange(symbol),
      quantity: qty,
      triggerPrice: trigger,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
