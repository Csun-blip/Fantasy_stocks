'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { RoomWithMeta } from '@/types';

interface MyRoom extends RoomWithMeta {
  isCreator?: boolean;
}

type Filter = 'active' | 'expired' | 'all';

const FILTER_TABS: { value: Filter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'all', label: 'All' },
];

export default function MyRoomsPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-20" />}>
      <MyRoomsContent />
    </Suspense>
  );
}

function MyRoomsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = (searchParams.get('filter') as Filter) ?? 'active';

  const [allRooms, setAllRooms] = useState<MyRoom[]>([]);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms/my')
      .then((r) => r.json())
      .then((data) => {
        setAllRooms(data.rooms ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleFilter = useCallback((f: Filter) => {
    setFilter(f);
    router.replace(`/rooms/my?filter=${f}`, { scroll: false });
  }, [router]);

  const activeRooms = allRooms.filter((r) => r.isActive);
  const expiredRooms = allRooms.filter((r) => !r.isActive);

  const visibleRooms =
    filter === 'active' ? activeRooms :
    filter === 'expired' ? expiredRooms :
    allRooms;

  const counts: Record<Filter, number> = {
    active: activeRooms.length,
    expired: expiredRooms.length,
    all: allRooms.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-foreground">My Rooms</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">My Rooms</h1>
          <p className="text-muted mt-1 text-sm">All competition rooms you have joined or created</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/rooms"
            className="text-sm bg-surface-raised border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-xl transition-colors"
          >
            Browse Public
          </Link>
          <Link
            href="/rooms/create"
            className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl transition-colors"
          >
            + Create Room
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-xl p-1 w-fit mb-6 overflow-x-auto max-w-full">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filter === tab.value
                ? 'bg-surface text-foreground shadow-sm border border-border'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
            {!loading && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                filter === tab.value
                  ? tab.value === 'active' ? 'bg-success/15 text-success'
                    : tab.value === 'expired' ? 'bg-muted/20 text-muted'
                    : 'bg-primary/15 text-primary'
                  : 'bg-border text-muted'
              }`}>
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : visibleRooms.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <div className="text-5xl mb-4">{filter === 'active' ? '🚀' : filter === 'expired' ? '📁' : '🏠'}</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {filter === 'active' ? 'No active rooms' : filter === 'expired' ? 'No expired rooms' : 'No rooms yet'}
          </h2>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            {filter === 'active'
              ? 'You are not in any active rooms. Create one or join a public room.'
              : filter === 'expired'
              ? 'None of your rooms have ended yet.'
              : 'Create a room or join a public competition to get started.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/rooms/create" className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl transition-colors text-sm font-medium">
              Create Room
            </Link>
            <Link href="/rooms" className="bg-surface border border-border hover:border-primary/50 text-foreground px-5 py-2.5 rounded-xl transition-colors text-sm font-medium">
              Browse Rooms
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {visibleRooms.map((room) => (
            <RoomCardWithBadges key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomCardWithBadges({ room }: { room: MyRoom }) {
  return (
    <div className="relative pt-2">
      {/* Creator / Private badges above card */}
      {(room.isCreator || !room.isPublic) && (
        <div className="absolute -top-0 left-3 z-10 flex items-center gap-1.5">
          {room.isCreator && (
            <span className="text-[10px] bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold">
              Created by you
            </span>
          )}
          {!room.isPublic && !room.isCreator && (
            <span className="text-[10px] bg-warning/20 border border-warning/30 text-warning px-2 py-0.5 rounded-full font-semibold">
              Private
            </span>
          )}
        </div>
      )}
      <RoomCard room={room} />
    </div>
  );
}
