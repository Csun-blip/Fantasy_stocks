export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeHoldingsFromTrades } from '@/lib/portfolio';
import { getBatchQuotes } from '@/lib/yahoo-finance';
import { sendRoomEndedEmail } from '@/lib/email';
import type { LeaderboardEntry } from '@/types';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);

  const room = await prisma.room.findUnique({
    where: { id: params.roomId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, email: true } } },
      },
    },
  });

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const [allTrades, allPendingOrders] = await Promise.all([
    prisma.trade.findMany({
      where: { roomId: params.roomId },
      orderBy: { executedAt: 'asc' },
    }),
    prisma.pendingOrder.findMany({
      where: { roomId: params.roomId, action: 'BUY' },
      select: { userId: true, reservedAmount: true },
    }),
  ]);

  const symbols = Array.from(new Set(allTrades.map((t) => t.symbol)));
  const prices = symbols.length > 0 ? await getBatchQuotes(symbols) : new Map();

  const entries: LeaderboardEntry[] = room.members.map((member) => {
    const userTrades = allTrades.filter((t) => t.userId === member.userId);
    const holdings = computeHoldingsFromTrades(userTrades);

    const holdingsValue = holdings.reduce((sum, h) => {
      const price = prices.get(h.symbol)?.price ?? h.avgCost;
      return sum + price * h.quantity;
    }, 0);

    const reservedCash = allPendingOrders
      .filter((o) => o.userId === member.userId)
      .reduce((sum, o) => sum + o.reservedAmount, 0);

    const totalValue = holdingsValue + member.cashBalance + reservedCash;
    const returnAmount = totalValue - room.startingCash;
    const returnPercent = (returnAmount / room.startingCash) * 100;
    const displayName = member.nickname?.trim() || member.user.username;

    return {
      rank: 0,
      userId: member.userId,
      username: member.user.username,
      displayName,
      totalValue,
      cashBalance: member.cashBalance,
      startingCash: room.startingCash,
      returnAmount,
      returnPercent,
      tradeCount: userTrades.length,
      isCurrentUser: session?.user?.id === member.userId,
    };
  });

  entries.sort((a, b) => b.totalValue - a.totalValue);
  entries.forEach((e, i) => { e.rank = i + 1; });

  // Aggregate top stocks traded in this room
  const stockMap = new Map<string, { symbol: string; companyName: string; totalTrades: number; totalVolume: number; netQuantity: number }>();
  for (const trade of allTrades) {
    const existing = stockMap.get(trade.symbol) ?? { symbol: trade.symbol, companyName: trade.companyName, totalTrades: 0, totalVolume: 0, netQuantity: 0 };
    existing.totalTrades += 1;
    existing.totalVolume += trade.totalValue;
    existing.netQuantity += trade.action === 'BUY' ? trade.quantity : -trade.quantity;
    stockMap.set(trade.symbol, existing);
  }
  const topStocks = Array.from(stockMap.values())
    .sort((a, b) => b.totalTrades - a.totalTrades)
    .slice(0, 8);

  const now = new Date();
  if (new Date(room.endsAt) <= now && !room.isExpired) {
    await prisma.room.update({ where: { id: room.id }, data: { isExpired: true } });
    Promise.allSettled(
      room.members.map((m) => {
        const userEntry = entries.find((e) => e.userId === m.userId);
        if (!userEntry) return Promise.resolve();
        return sendRoomEndedEmail({
          to: m.user.email,
          username: m.user.username,
          roomName: room.name,
          duration: room.duration,
          userEntry,
          leaderboard: entries,
        });
      })
    );
  }

  return NextResponse.json({ leaderboard: entries, room, topStocks });
}
