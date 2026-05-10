export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const now = new Date();
  if (new Date(room.endsAt) <= now) {
    return NextResponse.json({ error: 'This room has already ended' }, { status: 400 });
  }

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
  });
  if (existing) return NextResponse.json({ alreadyMember: true });

  const body = await req.json().catch(() => ({}));
  const nicknameValue = body.nickname?.trim() || null;
  if (nicknameValue && nicknameValue.length > 30) {
    return NextResponse.json({ error: 'Nickname too long (max 30 chars)' }, { status: 400 });
  }

  await prisma.roomMember.create({
    data: { roomId: room.id, userId: session.user.id, cashBalance: room.startingCash, nickname: nicknameValue },
  });

  return NextResponse.json({ alreadyMember: false }, { status: 201 });
}
