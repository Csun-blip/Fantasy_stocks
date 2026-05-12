'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  roomId: string;
  inviteCode: string;
  startingCash: number;
  hasStarted: boolean;
  fmt: (n: number) => string;
}

export default function JoinViaLinkForm({ roomId, inviteCode, startingCash, hasStarted, fmt }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteCode: inviteCode.toUpperCase(), nickname: nickname.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Failed to join room');
    } else {
      router.push(`/rooms/${data.roomId}`);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {hasStarted && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 text-xs text-warning">
          Competition is already in progress. You&apos;ll join with {fmt(startingCash)} and can start trading immediately.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-bright">Nickname (optional)</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your display name in this room"
          maxLength={30}
          className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
        />
        <p className="text-[10px] text-muted">Leave blank to use your username</p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Joining…' : `Join & Start with ${fmt(startingCash)}`}
      </button>
    </div>
  );
}
