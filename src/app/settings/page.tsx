'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useCurrency, CURRENCIES } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-muted-bright uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { currency, setCurrency, format } = useCurrency();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'err', text: 'New passwords do not match' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMsg({ type: 'err', text: data.error ?? 'Failed to change password' });
      }
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Account Settings</h1>
        <p className="text-muted-bright text-sm">Manage your profile and security preferences</p>
      </div>

      {/* Profile info (read-only) */}
      <Section title="Profile">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-raised rounded-xl p-4">
            <p className="text-xs text-muted-bright uppercase tracking-wider mb-1">Username</p>
            <p className="font-semibold text-foreground">{session?.user?.username ?? session?.user?.name}</p>
            <p className="text-xs text-muted mt-1">Cannot be changed</p>
          </div>
          <div className="bg-surface-raised rounded-xl p-4">
            <p className="text-xs text-muted-bright uppercase tracking-wider mb-1">Email</p>
            <p className="font-semibold text-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>
        <p className="text-xs text-muted mt-4">
          You can set a different nickname per room when creating or joining a room.
        </p>
      </Section>

      {/* Currency */}
      <Section title="Display Currency">
        <p className="text-sm text-muted-bright mb-4">
          All portfolio values, prices, and totals will be displayed in your chosen currency.
          Stock data is sourced in USD — this changes the display symbol only.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
                currency === c.code
                  ? 'bg-primary/10 border-primary text-foreground'
                  : 'bg-surface-raised border-border text-muted-bright hover:border-primary/40 hover:text-foreground'
              )}
            >
              <span className="text-xl leading-none">{c.flag}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground">{c.code}</p>
                <p className="text-[10px] text-muted truncate">{c.name}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="bg-surface-raised rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-muted-bright">Preview</span>
          <span className="font-mono font-bold text-foreground text-lg">{format(12345.67)}</span>
        </div>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Current Password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="finance-input"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New Password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="finance-input"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="finance-input"
              autoComplete="new-password"
            />
          </Field>
          {pwMsg && (
            <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-success' : 'text-danger'}`}>{pwMsg.text}</p>
          )}
          <button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
            className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pwLoading ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </Section>
    </div>
  );
}
