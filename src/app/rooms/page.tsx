'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RoomCard from '@/components/room/RoomCard';
import JoinRoomModal from '@/components/room/JoinRoomModal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { RoomWithMeta } from '@/types';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetch('/api/rooms')
      .then((r) => r.json())
      .then((data) => { setRooms(data.rooms ?? []); setLoading(false); });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Public Rooms</h1>
          <p className="text-muted mt-1 text-sm">Join a competition or create your own</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-sm bg-surface-raised border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-xl transition-colors"
          >
            🔑 Join Private
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
      ) : rooms.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No public rooms yet</h2>
          <p className="text-muted text-sm mb-6">Be the first to create one!</p>
          <Link href="/rooms/create" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl transition-colors font-medium">
            Create the First Room
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}

      {showJoinModal && <JoinRoomModal onClose={() => setShowJoinModal(false)} />}
    </div>
  );
}
