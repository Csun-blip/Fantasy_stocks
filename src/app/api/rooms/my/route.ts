export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ rooms: [] });

  const now = new Date();
  const memberships = await prisma.roomMember.findMany({
    where: { userId: session.user.id },
    include: { room: { include: { _count: { select: { members: true } } } } },
    orderBy: { room: { createdAt: 'desc' } },
  });

  const rooms = memberships.map((m) => ({
    ...m.room,
    memberCount: m.room._count.members,
    isMember: true,
    isActive: new Date(m.room.endsAt) > now,
    isCreator: m.room.createdById === session.user.id,
  }));

  return NextResponse.json({ rooms });
}
