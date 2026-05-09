'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function JoinRoomModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<'code' | 'nickname'>('code');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inviteCode: code.trim().toUpperCase(),
        nickname: nickname.trim() || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to join room');
      setStep('code');
    } else {
      router.push(`/rooms/${data.roomId}`);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Join a Private Room</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">✕</button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'code' ? 'text-primary' : 'text-success'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 'code' ? 'bg-primary text-white' : 'bg-success/20 text-success border border-success/40'}`}>
              {step === 'nickname' ? '✓' : '1'}
            </span>
            Invite Code
          </div>
          <div className="flex-1 h-px bg-border" />
          <div className={`flex items-center gap-1.5 text-xs font-medium ${step === 'nickname' ? 'text-primary' : 'text-muted'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === 'nickname' ? 'bg-primary text-white' : 'bg-surface-raised text-muted border border-border'}`}>2</span>
            Nickname
          </div>
        </div>

        {step === 'code' ? (
          <div className="flex flex-col gap-4">
            <Input
              label="Invite Code"
              placeholder="ABC12345"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="tracking-widest font-mono text-center text-lg uppercase"
              hint="8-character code shared by the room creator"
            />

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" disabled={!code.trim()} onClick={() => setStep('nickname')}>
                Next
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              label="Nickname (optional)"
              placeholder="Your display name in this room"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={30}
              hint="Leave blank to use your username"
              autoFocus
            />

            {error && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => { setStep('code'); setError(''); }}>
                Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Join Room
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
