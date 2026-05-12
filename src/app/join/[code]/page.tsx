export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { formatCurrency, durationLabel } from '@/lib/utils';
import { cookies } from 'next/headers';
import JoinViaLinkForm from './JoinViaLinkForm';

export default async function JoinViaLinkPage({ params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  const currency = cookies().get('fs_currency')?.value ?? 'USD';
  const fmt = (n: number) => formatCurrency(n, currency);

  const room = await prisma.room.findUnique({
    where: { inviteCode: params.code.toUpperCase() },
    include: { _count: { select: { members: true } } },
  });

  if (!room) notFound();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/join/${params.code}`);
  }

  const existing = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
  });

  if (existing) {
    redirect(`/rooms/${room.id}`);
  }

  const now = new Date();
  const ended = new Date(room.endsAt) <= now;
  const hasStarted = new Date(room.startsAt) <= now;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Room card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl mb-4">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-xs text-muted mb-1 uppercase tracking-widest">You&apos;re invited to join</p>
              <h1 className="text-2xl font-bold text-foreground">{room.name}</h1>
              {room.description && <p className="text-sm text-muted mt-1">{room.description}</p>}
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
              ended
                ? 'bg-muted/10 text-muted border-muted/20'
                : hasStarted
                ? 'bg-success/15 text-success border-success/30'
                : 'bg-warning/15 text-warning border-warning/30'
            }`}>
              {ended ? 'Ended' : hasStarted ? 'Active' : 'Lobby'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Starting Capital', value: fmt(room.startingCash) },
              { label: 'Duration', value: durationLabel(room.duration) },
              { label: 'Players', value: String(room._count.members) },
              { label: 'Ends', value: new Date(room.endsAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map((s) => (
              <div key={s.label} className="bg-surface-raised rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wide">{s.label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {ended ? (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-sm text-danger text-center">
              This room has already ended and is no longer accepting new players.
            </div>
          ) : (
            <JoinViaLinkForm roomId={room.id} inviteCode={params.code} startingCash={room.startingCash} hasStarted={hasStarted} fmt={fmt} />
          )}
        </div>
      </div>
    </div>
  );
}
