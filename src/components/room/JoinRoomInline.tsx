'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';

interface JoinRoomInlineProps {
  roomId: string;
  startingCash: number;
}

export default function JoinRoomInline({ roomId, startingCash }: JoinRoomInlineProps) {
  const { format } = useCurrency();
  const router = useRouter();
  const [step, setStep] = useState<'prompt' | 'nickname'>('prompt');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin() {
    setError('');
    setLoading(true);
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: nickname.trim() || undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || 'Failed to join');
    } else {
      router.refresh();
    }
  }

  if (step === 'prompt') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-bright">
          Start with {format(startingCash)} virtual money
        </p>
        <button
          className="w-full btn-primary"
          onClick={() => setStep('nickname')}
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-muted-bright uppercase tracking-wider">
          Nickname <span className="normal-case font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Your display name in this room"
          maxLength={30}
          className="bg-surface-raised border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
          autoFocus
        />
        <p className="text-xs text-muted">Leave blank to use your username</p>
      </div>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setStep('prompt'); setError(''); }}
          className="flex-1 py-2 px-3 rounded-xl border border-border text-sm text-muted-bright hover:text-foreground hover:border-border transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="flex-1 btn-primary text-sm disabled:opacity-50"
        >
          {loading ? 'Joining…' : 'Confirm Join'}
        </button>
      </div>
    </div>
  );
}
