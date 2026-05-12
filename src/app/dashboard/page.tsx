import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import MarketMovers from '@/components/trading/MarketMovers';

export const metadata = { title: 'Dashboard | Fantasy Stocks' };

const ACTIVE_ROOM_PREVIEW = 3;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const memberships = await prisma.roomMember.findMany({
    where: { userId: session.user.id },
    include: { room: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: 'desc' },
    take: 20,
  });

  const rooms = memberships.map((m) => ({
    ...m.room,
    memberCount: m.room._count.members,
    isMember: true,
    isActive: new Date(m.room.endsAt) > new Date(),
  }));

  const activeRooms = rooms.filter((r) => r.isActive);
  const endedRooms = rooms.filter((r) => !r.isActive);
  const previewRooms = activeRooms.slice(0, ACTIVE_ROOM_PREVIEW);
  const hasMore = activeRooms.length > ACTIVE_ROOM_PREVIEW;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {session.user.username || session.user.name}
          </h1>
          <p className="text-muted mt-1 text-sm">Your competition rooms</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/rooms"
            className="text-sm bg-surface-raised border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-xl transition-colors"
          >
            Browse Rooms
          </Link>
          <Link
            href="/rooms/create"
            className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-colors"
          >
            + Create Room
          </Link>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col gap-8">
          <div className="text-center py-16 bg-surface border border-border rounded-2xl">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No rooms yet</h2>
            <p className="text-muted text-sm mb-8 max-w-md mx-auto">
              Create a room and invite friends, or join an existing public room to start competing.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/rooms/create" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl transition-colors font-medium">
                Create Room
              </Link>
              <Link href="/rooms" className="bg-surface border border-border hover:border-primary/50 text-foreground px-6 py-3 rounded-xl transition-colors font-medium">
                Browse Rooms
              </Link>
            </div>
          </div>
          <MarketMovers />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {activeRooms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  Active Rooms ({activeRooms.length})
                </h2>
                {hasMore && (
                  <Link
                    href="/rooms/my"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    See all {activeRooms.length} rooms →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {previewRooms.map((room) => (
                  <RoomCard key={room.id} room={room as any} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-3 text-center">
                  <Link
                    href="/rooms/my"
                    className="text-sm text-muted hover:text-foreground border border-border hover:border-primary/40 px-4 py-2 rounded-xl transition-colors inline-block"
                  >
                    + {activeRooms.length - ACTIVE_ROOM_PREVIEW} more active room{activeRooms.length - ACTIVE_ROOM_PREVIEW !== 1 ? 's' : ''}
                  </Link>
                </div>
              )}
            </section>
          )}

          <MarketMovers />

          {endedRooms.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-muted mb-4">Ended Rooms ({endedRooms.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {endedRooms.map((room) => (
                  <RoomCard key={room.id} room={room as any} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
