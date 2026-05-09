'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';

const DURATIONS = [
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: '2y', label: '2 Years' },
  { value: '5y', label: '5 Years' },
];

const START_OPTIONS = [
  { value: 'now', label: 'Immediately', desc: 'Room starts as soon as you create it' },
  { value: 'scheduled', label: 'Scheduled', desc: 'Set a future date for the competition to begin' },
];

export default function CreateRoomForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    isPublic: true,
    startingCash: 10000,
    duration: '1m',
    nickname: '',
    startType: 'now',
    startsAt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Min datetime for the picker — 5 minutes from now
  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.startType === 'scheduled' && !form.startsAt) {
      setError('Please select a start date and time');
      return;
    }
    if (form.startType === 'scheduled' && new Date(form.startsAt) <= new Date()) {
      setError('Start time must be in the future');
      return;
    }

    setLoading(true);

    const body = {
      name: form.name,
      description: form.description,
      isPublic: form.isPublic,
      startingCash: form.startingCash,
      duration: form.duration,
      nickname: form.nickname,
      startsAt: form.startType === 'scheduled' ? new Date(form.startsAt).toISOString() : null,
    };

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to create room');
    } else {
      router.push(`/rooms/${data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Room Name"
        placeholder="e.g. S&P 500 Challenge 2025"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
        maxLength={60}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-bright">Description (optional)</label>
        <textarea
          className="bg-surface-raised border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          placeholder="Add a description for your room..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          maxLength={200}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-muted-bright">Starting Capital</label>
          <span className="font-mono text-primary font-semibold">{formatCurrency(form.startingCash)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={100000}
          step={1000}
          value={form.startingCash}
          onChange={(e) => setForm({ ...form, startingCash: Number(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted">
          <span>€1,000</span>
          <span>€100,000</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted-bright">Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setForm({ ...form, duration: d.value })}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border ${
                form.duration === d.value
                  ? 'bg-primary border-primary text-white'
                  : 'bg-surface-raised border-border text-muted hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Start time */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-bright">Competition Start</label>
        <div className="grid grid-cols-2 gap-3">
          {START_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, startType: opt.value })}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                form.startType === opt.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface-raised border-border hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{opt.value === 'now' ? '⚡' : '📅'}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {form.startType === 'scheduled' && (
          <div className="flex flex-col gap-1.5">
            <input
              type="datetime-local"
              min={minDateTime}
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="bg-surface-raised border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              required={form.startType === 'scheduled'}
            />
            <p className="text-xs text-muted">Players can join until this time. Trading starts when the competition begins.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-muted-bright">Visibility</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, label: 'Public', desc: 'Anyone can join', icon: '🌍' },
            { value: false, label: 'Private', desc: 'Invite code only', icon: '🔒' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setForm({ ...form, isPublic: opt.value })}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                form.isPublic === opt.value
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface-raised border-border hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{opt.label}</p>
                <p className="text-xs text-muted">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Your Nickname (optional)"
        placeholder="Your display name in this room"
        value={form.nickname}
        onChange={(e) => setForm({ ...form, nickname: e.target.value })}
        maxLength={30}
        hint="Leave blank to use your username"
      />

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} size="lg">
        Create Room
      </Button>
    </form>
  );
}
