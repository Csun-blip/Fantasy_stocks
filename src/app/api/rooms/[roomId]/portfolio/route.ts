import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPortfolioSummary } from '@/lib/portfolio';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
    include: { room: { select: { startingCash: true } } },
  });

  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  const trades = await prisma.trade.findMany({
    where: { roomId: params.roomId, userId: session.user.id },
    orderBy: { executedAt: 'asc' },
  });

  const summary = await buildPortfolioSummary(trades, member.cashBalance, member.room.startingCash);

  return NextResponse.json(summary);
}
