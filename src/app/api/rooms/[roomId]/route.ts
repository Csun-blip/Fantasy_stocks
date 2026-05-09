export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const room = await prisma.room.findUnique({
    where: { id: params.roomId },
    include: { _count: { select: { members: true } } },
  });

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const isMember = userId
    ? !!(await prisma.roomMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId } } }))
    : false;

  return NextResponse.json({
    ...room,
    memberCount: room._count.members,
    isMember,
    isActive: new Date(room.endsAt) > new Date(),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  if (room.createdById !== session.user.id) {
    return NextResponse.json({ error: 'Only the room creator can delete this room' }, { status: 403 });
  }

  await prisma.room.delete({ where: { id: params.roomId } });
  return NextResponse.json({ success: true });
}
