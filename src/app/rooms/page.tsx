'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import JoinRoomModal from '@/components/room/JoinRoomModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import type { RoomWithMeta } from '@/types';

interface MyRoom extends RoomWithMeta {
  isCreator?: boolean;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [myRooms, setMyRooms] = useState<MyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/rooms/my').then((r) => r.json()).catch(() => ({ rooms: [] })),
    ]).then(([publicData, myData]) => {
      setRooms(publicData.rooms ?? []);
      setMyRooms(myData.rooms ?? []);
      setLoading(false);
    });
  }, []);

  // Public rooms excluding ones the user is already shown in "My Rooms"
  const myRoomIds = new Set(myRooms.map((r) => r.id));
  const browseRooms = rooms.filter((r) => !myRoomIds.has(r.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rooms</h1>
          <p className="text-muted mt-1 text-sm">Your active rooms and public competitions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-sm bg-surface-raised border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-xl transition-colors"
          >
            Join Private
          </button>
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
      ) : (
        <div className="flex flex-col gap-10">
          {/* My Active Rooms */}
          {myRooms.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  My Active Rooms
                  <span className="text-sm font-normal text-muted">({myRooms.length})</span>
                </h2>
                <Link href="/rooms/my" className="text-sm text-primary hover:underline">
                  See all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {myRooms.map((room) => (
                  <div key={room.id} className="relative">
                    {room.isCreator && (
                      <div className="absolute -top-2 left-3 z-10">
                        <span className="text-[10px] bg-primary/20 border border-primary/30 text-primary px-2 py-0.5 rounded-full font-semibold">
                          Created by you
                        </span>
                      </div>
                    )}
                    {!room.isPublic && (
                      <div className="absolute -top-2 right-3 z-10">
                        <Badge variant="yellow">Private</Badge>
                      </div>
                    )}
                    <RoomCard room={room} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Browse Public Rooms */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4">Browse Public Rooms</h2>
            {browseRooms.length === 0 ? (
              <div className="text-center py-16 bg-surface border border-border rounded-2xl">
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {rooms.length === 0 ? 'No public rooms yet' : 'You have joined all public rooms!'}
                </h3>
                <p className="text-muted text-sm mb-6">Be the first to create one!</p>
                <Link href="/rooms/create" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl transition-colors font-medium text-sm">
                  Create a Room
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {browseRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}
    </div>
  );
}
