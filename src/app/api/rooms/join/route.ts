export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteCode, nickname } = await req.json();
  if (!inviteCode) return NextResponse.json({ error: 'Invite code required' }, { status: 400 });

  const room = await prisma.room.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const now = new Date();
  if (new Date(room.endsAt) <= now) {
    return NextResponse.json({ error: 'This room has already ended' }, { status: 400 });
  }
  if (new Date(room.startsAt) <= now) {
    return NextResponse.json({ error: 'This room has already started — no new players can join' }, { status: 400 });
  }

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
  });

  if (existing) return NextResponse.json({ roomId: room.id, alreadyMember: true });

  const nicknameValue = nickname?.trim() || null;
  if (nicknameValue && nicknameValue.length > 30) {
    return NextResponse.json({ error: 'Nickname too long (max 30 chars)' }, { status: 400 });
  }

  await prisma.roomMember.create({
    data: { roomId: room.id, userId: session.user.id, cashBalance: room.startingCash, nickname: nicknameValue },
  });

  return NextResponse.json({ roomId: room.id, alreadyMember: false });
}
