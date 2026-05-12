'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import type { RoomWithMeta } from '@/types';

interface MyRoom extends RoomWithMeta {
  isCreator?: boolean;
}

export default function MyRoomsPage() {
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rooms/my')
      .then((r) => r.json())
      .then((data) => {
        setRooms(data.rooms ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const publicRooms = rooms.filter((r) => r.isPublic);
  const privateRooms = rooms.filter((r) => !r.isPublic);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted mb-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <span>My Active Rooms</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            My Active Rooms
          </h1>
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

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : rooms.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No active rooms</h2>
          <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
            You are not in any active rooms right now. Create one or join a public room.
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
        <div className="flex flex-col gap-8">
          {privateRooms.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="yellow">Private</Badge>
                <h2 className="text-base font-semibold text-foreground">Private Rooms</h2>
                <span className="text-sm text-muted">({privateRooms.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {privateRooms.map((room) => (
                  <RoomCardWithRole key={room.id} room={room} isCreator={room.isCreator} />
                ))}
              </div>
            </section>
          )}

          {publicRooms.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="green">Public</Badge>
                <h2 className="text-base font-semibold text-foreground">Public Rooms</h2>
                <span className="text-sm text-muted">({publicRooms.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicRooms.map((room) => (
                  <RoomCardWithRole key={room.id} room={room} isCreator={room.isCreator} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RoomCardWithRole({ room, isCreator }: { room: MyRoom; isCreator?: boolean }) {
  return (
    <div className="relative">
      {isCreator && (
        <div className="absolute -top-2 left-3 z-10">
          <span className="text-[10px] bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold">
            Created by you
          </span>
        </div>
      )}
      <RoomCard room={room} />
    </div>
  );
}
