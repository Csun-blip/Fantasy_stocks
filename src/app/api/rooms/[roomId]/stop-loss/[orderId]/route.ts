export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { roomId: string; orderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.stopLossOrder.findUnique({ where: { id: params.orderId } });
  if (!order) return NextResponse.json({ error: 'Stop loss not found' }, { status: 404 });
  if (order.userId !== session.user.id || order.roomId !== params.roomId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.stopLossOrder.delete({ where: { id: params.orderId } });
  return NextResponse.json({ success: true });
}
