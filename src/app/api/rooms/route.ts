export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateInviteCode, durationToDays } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = 12;
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { _count: { select: { members: true } } },
    }),
    prisma.room.count({ where: { isPublic: true } }),
  ]);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const roomsWithMeta = await Promise.all(
    rooms.map(async (r) => {
      const isMember = userId
        ? !!(await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: r.id, userId } } }))
        : false;
      return {
        ...r,
        memberCount: r._count.members,
        isMember,
        isActive: new Date(r.endsAt) > new Date(),
      };
    })
  );

  return NextResponse.json({ rooms: roomsWithMeta, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, isPublic, startingCash, duration, nickname } = await req.json();

    if (!name || !duration) return NextResponse.json({ error: 'Name and duration required' }, { status: 400 });

    const cash = Math.max(1000, Math.min(100000, Number(startingCash) || 10000));
    const days = durationToDays(duration);
    const endsAt = new Date(Date.now() + days * 86400000);

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    while (await prisma.room.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const room = await prisma.$transaction(async (tx) => {
      const r = await tx.room.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isPublic: Boolean(isPublic),
          inviteCode,
          startingCash: cash,
          duration,
          endsAt,
          createdById: session.user.id,
        },
      });

      const nicknameValue = nickname?.trim() || null;
      await tx.roomMember.create({
        data: { roomId: r.id, userId: session.user.id, cashBalance: cash, nickname: nicknameValue },
      });

      return r;
    });

    return NextResponse.json(room, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
