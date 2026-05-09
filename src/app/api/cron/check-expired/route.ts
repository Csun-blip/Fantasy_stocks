export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeHoldingsFromTrades } from '@/lib/portfolio';
import { getBatchQuotes } from '@/lib/yahoo-finance';
import { sendRoomEndedEmail } from '@/lib/email';
import type { LeaderboardEntry } from '@/types';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expiredRooms = await prisma.room.findMany({
    where: { endsAt: { lte: new Date() }, isExpired: false },
    include: {
      members: { include: { user: { select: { id: true, username: true, email: true } } } },
    },
  });

  let processed = 0;

  for (const room of expiredRooms) {
    try {
      const allTrades = await prisma.trade.findMany({
        where: { roomId: room.id },
        orderBy: { executedAt: 'asc' },
      });

      const symbols = Array.from(new Set(allTrades.map((t) => t.symbol)));
      const prices = symbols.length > 0 ? await getBatchQuotes(symbols) : new Map();

      const entries: LeaderboardEntry[] = room.members.map((member) => {
        const userTrades = allTrades.filter((t) => t.userId === member.userId);
        const holdings = computeHoldingsFromTrades(userTrades);
        const holdingsValue = holdings.reduce((sum, h) => sum + (prices.get(h.symbol)?.price ?? h.avgCost) * h.quantity, 0);
        const totalValue = holdingsValue + member.cashBalance;
        const returnAmount = totalValue - room.startingCash;
        const returnPercent = (returnAmount / room.startingCash) * 100;

        return {
          rank: 0,
          userId: member.userId,
          username: member.user.username,
          displayName: member.user.username,
          totalValue,
          cashBalance: member.cashBalance,
          startingCash: room.startingCash,
          returnAmount,
          returnPercent,
          tradeCount: userTrades.length,
          isCurrentUser: false,
        };
      });

      entries.sort((a, b) => b.totalValue - a.totalValue);
      entries.forEach((e, i) => { e.rank = i + 1; });

      await prisma.room.update({ where: { id: room.id }, data: { isExpired: true } });

      await Promise.allSettled(
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

      processed++;
    } catch (err) {
      console.error(`Failed to process room ${room.id}:`, err);
    }
  }

  return NextResponse.json({ processed, total: expiredRooms.length });
}
