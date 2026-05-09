import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatBox from '@/components/chat/ChatBox';
import ChatViewed from '@/components/chat/ChatViewed';
import RoomNav from '@/components/room/RoomNav';

export default async function ChatPage({ params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const room = await prisma.room.findUnique({ where: { id: params.roomId } });
  if (!room) redirect('/rooms');

  const member = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: params.roomId, userId: session.user.id } },
  });

  if (!member) redirect(`/rooms/${params.roomId}`);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <ChatViewed roomId={params.roomId} />

      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href={`/rooms/${params.roomId}`} className="hover:text-foreground transition-colors">← Back to Room</Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Chat</h1>
        <p className="text-sm text-muted">{room.name}</p>
      </div>

      <RoomNav roomId={params.roomId} isMember={true} />

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <ChatBox roomId={params.roomId} />
      </div>
    </div>
  );
}
