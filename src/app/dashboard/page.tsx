import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import MarketMovers from '@/components/trading/MarketMovers';

export const metadata = { title: 'Dashboard | Fantasy Stocks' };

const ACTIVE_PREVIEW = 3;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const now = new Date();

  // Fetch all memberships sorted by room creation (newest first) — no take limit
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
  }));

  const activeRooms = rooms.filter((r) => r.isActive);
  const endedRooms = rooms.filter((r) => !r.isActive);

  // Show newest 3 active rooms; count is exact total
  const activePreview = activeRooms.slice(0, ACTIVE_PREVIEW);
  const activeOverflow = activeRooms.length - ACTIVE_PREVIEW;

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
                <Link
                  href="/rooms/my?filter=active"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  See all →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {activePreview.map((room) => (
                  <RoomCard key={room.id} room={room as any} />
                ))}
              </div>

              {activeOverflow > 0 && (
                <div className="mt-3 text-center">
                  <Link
                    href="/rooms/my?filter=active"
                    className="text-sm text-muted hover:text-foreground border border-border hover:border-primary/40 px-5 py-2 rounded-xl transition-colors inline-block"
                  >
                    + {activeOverflow} more active room{activeOverflow !== 1 ? 's' : ''}
                  </Link>
                </div>
              )}
            </section>
          )}

          <MarketMovers />

          {endedRooms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-muted flex items-center gap-2">
                  Ended Rooms ({endedRooms.length})
                </h2>
                <Link
                  href="/rooms/my?filter=expired"
                  className="text-sm text-muted hover:text-foreground hover:underline"
                >
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {endedRooms.slice(0, 3).map((room) => (
                  <RoomCard key={room.id} room={room as any} />
                ))}
              </div>
              {endedRooms.length > 3 && (
                <div className="mt-3 text-center">
                  <Link
                    href="/rooms/my?filter=expired"
                    className="text-sm text-muted hover:text-foreground border border-border hover:border-primary/40 px-5 py-2 rounded-xl transition-colors inline-block"
                  >
                    + {endedRooms.length - 3} more ended room{endedRooms.length - 3 !== 1 ? 's' : ''}
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
