import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import InviteCode from '@/components/room/InviteCode';
import RoomTimer from '@/components/room/RoomTimer';
import RoomNav from '@/components/room/RoomNav';
import RoomHistory from '@/components/room/RoomHistory';
import Leaderboard from '@/components/leaderboard/Leaderboard';
import JoinRoomInline from '@/components/room/JoinRoomInline';
import { formatCurrency, durationLabel } from '@/lib/utils';

export default async function RoomPage({ params }: { params: { roomId: string } }) {
  const session = await getServerSession(authOptions);

  const room = await prisma.room.findUnique({
    where: { id: params.roomId },
    include: { _count: { select: { members: true } } },
  });

  if (!room) notFound();

  const isMember = session?.user?.id
    ? !!(await prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
      }))
    : false;

  const isAdmin = session?.user?.id === room.createdById;
  const isActive = new Date(room.endsAt) > new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isActive ? 'green' : 'gray'}>{isActive ? 'Active' : 'Ended'}</Badge>
            {!room.isPublic && <Badge variant="yellow">Private</Badge>}
            {isAdmin && <Badge variant="blue">Admin</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{room.name}</h1>
          {room.description && <p className="text-muted-bright mt-2">{room.description}</p>}
        </div>

        <div className="flex gap-3 shrink-0">
          {isMember && isActive && (
            <Link href={`/rooms/${room.id}/trade`} className="btn-primary text-sm">
              Trade Now
            </Link>
          )}
          {isAdmin && (
            <form action={async () => {
              'use server';
              const { prisma: db } = await import('@/lib/prisma');
              const { getServerSession: gss } = await import('next-auth');
              const { authOptions: ao } = await import('@/lib/auth');
              const sess = await gss(ao);
              if (!sess?.user?.id) return;
              const r = await db.room.findUnique({ where: { id: params.roomId } });
              if (!r || r.createdById !== sess.user.id) return;
              await db.room.delete({ where: { id: params.roomId } });
              redirect('/rooms');
            }}>
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 hover:border-danger/60 transition-colors"
              >
                Delete Room
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Starting Capital" value={formatCurrency(room.startingCash)} />
        <StatCard label="Duration" value={durationLabel(room.duration)} />
        <StatCard label="Players" value={String(room._count.members)} />
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <p className="text-xs text-muted-bright mb-1">Time Remaining</p>
          <RoomTimer endsAt={room.endsAt.toISOString()} />
        </div>
      </div>

      <RoomNav roomId={room.id} isMember={isMember} />

      {isActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-semibold text-foreground mb-4">Live Leaderboard</h2>
              <Leaderboard roomId={room.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
              {isMember ? (
                <>
                  <h3 className="font-medium text-foreground mb-3">Invite Friends</h3>
                  <p className="text-xs text-muted-bright mb-3">Share this code to invite others:</p>
                  <InviteCode code={room.inviteCode} />
                </>
              ) : (
                <>
                  <h3 className="font-medium text-foreground mb-3">Join this room</h3>
                  {session ? (
                    <JoinRoomInline roomId={room.id} startingCash={room.startingCash} />
                  ) : (
                    <>
                      <p className="text-sm text-muted-bright mb-4">
                        Start with {formatCurrency(room.startingCash)} virtual money
                      </p>
                      <Link href="/login" className="block text-center btn-primary">
                        Log In to Join
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 shadow-card">
              <h3 className="font-medium text-foreground mb-4">Room Details</h3>
              <dl className="flex flex-col gap-3 text-sm">
                <Detail label="Created" value={new Date(room.createdAt).toLocaleDateString('de-DE')} />
                <Detail label="Starts" value={new Date(room.startsAt).toLocaleDateString('de-DE')} />
                <Detail label="Ends" value={new Date(room.endsAt).toLocaleDateString('de-DE')} />
                <Detail label="Visibility" value={room.isPublic ? 'Public' : 'Private'} />
              </dl>
            </div>
          </div>
        </div>
      ) : (
        /* Expired room — show history */
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-bright px-2">Competition Ended</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <RoomHistory roomId={room.id} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
      <p className="text-xs text-muted-bright mb-1">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-bright">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}
