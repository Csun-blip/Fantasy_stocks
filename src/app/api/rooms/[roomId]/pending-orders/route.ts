export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { symbolToExchange } from '@/lib/utils';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.pendingOrder.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(orders);
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
