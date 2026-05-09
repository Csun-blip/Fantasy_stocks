import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const after = searchParams.get('after');
  const limit = 50;

  const msgInclude = {
    user: {
      select: {
        id: true,
        username: true,
        memberships: { where: { roomId: params.roomId }, select: { nickname: true } },
      },
    },
  } as const;

  let messages: Awaited<ReturnType<typeof prisma.chatMessage.findMany<{ include: typeof msgInclude }>>>;

  if (after) {
    const pivot = await prisma.chatMessage.findUnique({ where: { id: after } });
    if (pivot) {
      messages = await prisma.chatMessage.findMany({
        where: { roomId: params.roomId, createdAt: { gt: pivot.createdAt } },
        include: msgInclude,
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } else {
      messages = [];
    }
  } else {
    messages = await prisma.chatMessage.findMany({
      where: { roomId: params.roomId },
      include: msgInclude,
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  const shaped = messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    userId: m.userId,
    roomId: m.roomId,
    user: {
      id: m.user.id,
      username: m.user.username,
      displayName: m.user.memberships[0]?.nickname?.trim() || m.user.username,
    },
  }));

  return NextResponse.json(shaped);
}

export async function POST(req: NextRequest, { params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Not a member of this room' }, { status: 403 });

  const message = await prisma.chatMessage.create({
    data: { roomId: params.roomId, userId: session.user.id, content: content.trim() },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          memberships: { where: { roomId: params.roomId }, select: { nickname: true } },
        },
      },
    },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    userId: message.userId,
    roomId: message.roomId,
    user: {
      id: message.user.id,
      username: message.user.username,
      displayName: message.user.memberships[0]?.nickname?.trim() || message.user.username,
    },
  }, { status: 201 });
}
