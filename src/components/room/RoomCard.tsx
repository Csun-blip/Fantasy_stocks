'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { durationLabel, timeRemaining } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import type { RoomWithMeta } from '@/types';

interface RoomCardProps {
  room: RoomWithMeta;
  isCreator?: boolean;
}

export default function RoomCard({ room, isCreator }: RoomCardProps) {
  const { format } = useCurrency();
  const active = room.isActive;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-all duration-200 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isCreator && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-danger/15 border border-danger/30 text-danger px-2 py-0.5 rounded-full font-semibold mb-1.5">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-danger text-white rounded-full text-[8px] font-bold leading-none">A</span>
              Admin
            </span>
          )}
          <h3 className="font-semibold text-foreground truncate">{room.name}</h3>
          {/* Always reserve 2-line height so cards align regardless of description */}
          <p className="text-sm text-muted mt-0.5 line-clamp-2 min-h-[2.5rem]">
            {room.description ?? ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={active ? 'green' : 'gray'}>{active ? 'Active' : 'Ended'}</Badge>
          {!room.isPublic && <Badge variant="yellow">Private</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Starting Capital" value={format(room.startingCash)} />
        <Stat label="Duration" value={durationLabel(room.duration)} />
        <Stat label="Players" value={`${room.memberCount}`} />
        <Stat label={active ? 'Ends' : 'Ended'} value={timeRemaining(room.endsAt)} />
      </div>

      <div className="flex gap-2 pt-1 mt-auto">
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
