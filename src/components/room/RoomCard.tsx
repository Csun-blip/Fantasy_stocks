'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { formatCurrency, durationLabel, timeRemaining } from '@/lib/utils';
import type { RoomWithMeta } from '@/types';

export default function RoomCard({ room }: { room: RoomWithMeta }) {
  const active = room.isActive;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{room.name}</h3>
          {room.description && <p className="text-sm text-muted mt-0.5 line-clamp-2">{room.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={active ? 'green' : 'gray'}>{active ? 'Active' : 'Ended'}</Badge>
          {!room.isPublic && <Badge variant="yellow">Private</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Starting Capital" value={formatCurrency(room.startingCash)} />
        <Stat label="Duration" value={durationLabel(room.duration)} />
        <Stat label="Players" value={`${room.memberCount}`} />
        <Stat label={active ? 'Ends' : 'Ended'} value={timeRemaining(room.endsAt)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Link
          href={`/rooms/${room.id}`}
          className="flex-1 text-center text-sm bg-surface-raised hover:bg-border border border-border text-foreground py-2 rounded-xl transition-colors"
        >
          {room.isMember ? 'Open Room' : 'View Room'}
        </Link>
        {room.isMember && active && (
          <Link
            href={`/rooms/${room.id}/trade`}
            className="flex-1 text-center text-sm bg-primary hover:bg-primary-hover text-white py-2 rounded-xl transition-colors"
          >
            Trade
          </Link>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-raised rounded-xl px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
