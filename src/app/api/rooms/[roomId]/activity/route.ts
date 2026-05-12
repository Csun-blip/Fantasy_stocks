export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Must be a member to view room activity
  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  // Optional: filter by a specific player
  const filterUserId = new URL(req.url).searchParams.get('userId') ?? undefined;

  // Fetch all trades for the room with player info
  const [trades, members] = await Promise.all([
    prisma.trade.findMany({
      where: { roomId: params.roomId, ...(filterUserId ? { userId: filterUserId } : {}) },
      orderBy: { executedAt: 'desc' },
      take: 200,
      include: { user: { select: { username: true } } },
    }),
    prisma.roomMember.findMany({
      where: { roomId: params.roomId },
      select: { userId: true, nickname: true },
    }),
  ]);

  const nicknameMap = new Map(members.map((m) => [m.userId, m.nickname]));

  const activity = trades.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    companyName: t.companyName,
    exchange: t.exchange,
    action: t.action,
    quantity: t.quantity,
    pricePerShare: t.pricePerShare,
    totalValue: t.totalValue,
    executedAt: t.executedAt.toISOString(),
    player: {
      userId: t.userId,
      displayName: nicknameMap.get(t.userId) || t.user.username,
      isCurrentUser: t.userId === session.user.id,
    },
  }));

  return NextResponse.json({ activity });
}
