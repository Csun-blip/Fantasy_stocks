'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const DONE_KEY = 'fs_tour_v1';

// ─── Illustrations ────────────────────────────────────────────────────────────

function IllWelcome() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="text-6xl drop-shadow-2xl" style={{ animation: 'float 6s ease-in-out infinite' }}>🏆</div>
        <div className="absolute -top-1 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-[9px] font-black text-yellow-900 shadow-lg">
          #1
        </div>
      </div>
      <div className="flex gap-2">
        {[
          { label: 'Portfolio', value: '$18,240', color: 'text-white' },
          { label: 'Return', value: '+12.4%', color: 'text-green-400' },
          { label: 'Rank', value: '1 / 8', color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 text-center border border-white/10">
            <p className="text-white/50 text-[8px] uppercase tracking-wide mb-0.5">{s.label}</p>
            <p className={cn('font-bold text-sm font-mono', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>
      <p className="text-white/40 text-xs tracking-wide">Real market data. Virtual money.</p>
    </div>
  );
}

function IllCreateRoom() {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[210px] mx-auto">
      <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
        <p className="text-white/40 text-[8px] uppercase tracking-wide mb-1.5">Room Name</p>
        <div className="bg-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <p className="text-white text-xs font-medium">Tech Giants Battle</p>
        </div>
      </div>
      <div className="flex gap-2">
        {[
          { l: 'Starting Cash', v: '$10,000' },
          { l: 'Duration', v: '7 days' },
        ].map((f) => (
          <div key={f.l} className="bg-white/10 rounded-2xl p-3 border border-white/10 flex-1">
            <p className="text-white/40 text-[8px] uppercase tracking-wide mb-1">{f.l}</p>
            <p className="text-white font-bold text-xs font-mono">{f.v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex-1">
          <p className="text-white/40 text-[8px] uppercase tracking-wide mb-1">Visibility</p>
          <div className="flex gap-1">
            <div className="bg-blue-500/40 border border-blue-400/40 rounded-lg px-2 py-0.5">
              <p className="text-blue-200 text-[9px] font-semibold">Public</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
              <p className="text-white/30 text-[9px]">Private</p>
            </div>
          </div>
        </div>
      </div>
      <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-2 text-xs font-bold shadow-lg shadow-blue-500/20">
        Create Room
      </button>
    </div>
  );
}

function IllInvite() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-4xl">🔗</div>
      <div className="bg-white/10 rounded-2xl p-5 border border-white/15 w-full max-w-[200px] text-center">
        <p className="text-white/40 text-[8px] uppercase tracking-widest mb-3">Your Invite Code</p>
        <p className="font-mono text-2xl font-black tracking-[0.3em] text-white">FS-7X4K</p>
        <div className="mt-3 bg-white/10 hover:bg-white/15 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 cursor-pointer border border-white/10">
          <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <p className="text-white/60 text-xs">Copy Code</p>
        </div>
      </div>
      <p className="text-white/40 text-xs text-center">Friends enter this to join your room</p>
    </div>
  );
}

function IllLeaderboard() {
  const players = [
    { rank: 1, name: 'AlexT', pct: '+18.4%', gold: true },
    { rank: 2, name: 'Jamie', pct: '+12.1%', gold: false },
    { rank: 3, name: 'You', pct: '+9.7%', you: true },
    { rank: 4, name: 'Maria', pct: '+6.2%', gold: false },
  ];
  return (
    <div className="w-full max-w-[220px] mx-auto flex flex-col gap-1.5">
      <p className="text-white/40 text-[8px] uppercase tracking-widest text-center mb-2">Live Rankings</p>
      {players.map((p) => (
        <div
          key={p.rank}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors',
            p.you
              ? 'bg-blue-500/20 border-blue-400/30'
              : p.gold
              ? 'bg-yellow-400/10 border-yellow-400/20'
              : 'bg-white/8 border-white/10'
          )}
        >
          <span className={cn('text-xs font-black w-5 text-center', p.gold ? 'text-yellow-400' : p.you ? 'text-blue-300' : 'text-white/40')}>
            #{p.rank}
          </span>
          <span className={cn('text-xs flex-1 font-medium', p.you ? 'text-blue-200' : 'text-white/75')}>
            {p.name}{p.you ? ' (you)' : ''}
          </span>
          <span className="text-green-400 text-xs font-mono font-bold">{p.pct}</span>
        </div>
      ))}
    </div>
  );
}

function IllTrade() {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[210px] mx-auto">
      <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
        <p className="text-white/40 text-[8px] uppercase tracking-wide mb-2">Find a Stock</p>
        <div className="bg-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <p className="text-white/70 text-xs">AAPL — Apple Inc.</p>
        </div>
        <div className="mt-2.5 flex justify-between items-center">
          <p className="text-white/40 text-[10px]">Current Price</p>
          <p className="text-green-400 font-mono font-bold text-sm">$189.45</p>
        </div>
      </div>
      <div className="flex gap-2">
        {[{ l: 'Qty', v: '5' }, { l: 'Total', v: '$947' }].map((f) => (
          <div key={f.l} className="bg-white/10 rounded-xl p-2.5 border border-white/10 flex-1 text-center">
            <p className="text-white/40 text-[8px] uppercase mb-1">{f.l}</p>
            <p className="text-white font-bold text-sm font-mono">{f.v}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl py-2 text-xs font-bold shadow-lg shadow-green-500/20">
          Buy
        </button>
        <button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-2 text-xs font-bold shadow-lg shadow-red-500/20">
          Sell
        </button>
      </div>
    </div>
  );
}

function IllPending() {
  return (
    <div className="flex flex-col gap-2.5 w-full max-w-[210px] mx-auto">
      <div className="bg-amber-500/15 border border-amber-400/25 rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-amber-400 text-sm">⏰</span>
          <p className="text-amber-300 text-xs font-semibold">Market is closed</p>
        </div>
        <p className="text-amber-400/60 text-[9px] leading-relaxed">Your order will be queued and executed when the market opens tomorrow.</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-400/20">BUY</span>
            <p className="text-white font-mono text-xs font-bold">TSLA</p>
          </div>
          <p className="text-white/50 text-[10px]">3 shares</p>
        </div>
        <p className="text-white/35 text-[9px]">$744.60 reserved from your cash</p>
      </div>
      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/8">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <p className="text-white/40 text-[9px]">Executes automatically at market open</p>
      </div>
    </div>
  );
}

function IllPortfolio() {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[220px] mx-auto">
      <div className="flex gap-2 mb-1">
        {[
          { l: 'Total Value', v: '$22,140', c: 'text-white' },
          { l: 'Return', v: '+12.4%', c: 'text-green-400' },
        ].map((s) => (
          <div key={s.l} className="bg-white/10 rounded-xl p-2.5 border border-white/10 flex-1">
            <p className="text-white/40 text-[8px] uppercase tracking-wide">{s.l}</p>
            <p className={cn('font-mono font-bold text-sm mt-0.5', s.c)}>{s.v}</p>
          </div>
        ))}
      </div>
      {[
        { sym: 'AAPL', qty: 5, val: '$947', pct: '+4.2%' },
        { sym: 'MSFT', qty: 3, val: '$1,243', pct: '+7.1%' },
        { sym: 'NVDA', qty: 2, val: '$1,780', pct: '+9.8%' },
      ].map((h) => (
        <div key={h.sym} className="flex items-center gap-2 bg-white/8 rounded-xl px-2.5 py-2 border border-white/8">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <p className="text-blue-300 text-[9px] font-black">{h.sym[0]}</p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-mono text-xs font-semibold">{h.sym}</p>
            <p className="text-white/35 text-[9px]">{h.qty} shares</p>
          </div>
          <div className="text-right mr-1">
            <p className="text-white text-xs font-mono">{h.val}</p>
            <p className="text-green-400 text-[9px] font-mono">{h.pct}</p>
          </div>
          <button className="bg-red-500/20 text-red-400 text-[8px] px-1.5 py-1 rounded-lg font-bold border border-red-400/20 shrink-0">
            Sell
          </button>
        </div>
      ))}
    </div>
  );
}

function IllChat() {
  return (
    <div className="flex flex-col gap-2 w-full max-w-[210px] mx-auto">
      <p className="text-white/30 text-[8px] uppercase tracking-widest text-center mb-1">Room Chat</p>
      {[
        { name: 'AlexT', msg: 'Just doubled down on NVDA 🚀', mine: false },
        { name: 'Jamie', msg: "You're going to regret that lol", mine: false },
        { name: 'You', msg: "We'll see who's laughing Friday 😎", mine: true },
      ].map((m, i) => (
        <div key={i} className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}>
          <div
            className={cn(
              'rounded-2xl px-3 py-2 max-w-[170px]',
              m.mine
                ? 'bg-blue-500/70 rounded-br-sm'
                : 'bg-white/10 border border-white/10 rounded-bl-sm'
            )}
          >
            {!m.mine && <p className="text-white/50 text-[8px] font-semibold mb-0.5">{m.name}</p>}
            <p className="text-white text-[10px] leading-relaxed">{m.msg}</p>
          </div>
        </div>
      ))}
      <div className="bg-white/8 rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2 mt-1">
        <p className="text-white/25 text-[10px] flex-1">Say something...</p>
        <div className="w-5 h-5 rounded-lg bg-blue-500/60 flex items-center justify-center shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function IllReady() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex gap-2 text-4xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
        <span>🎉</span><span>📈</span><span>💰</span>
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl mb-1">You're all set!</p>
        <p className="text-white/45 text-xs leading-relaxed">May your portfolio grow and<br/>your rivals weep.</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-[180px]">
        <div className="bg-blue-500/70 border border-blue-400/40 rounded-xl px-4 py-2 text-center">
          <p className="text-white text-xs font-bold">Create a Room</p>
        </div>
        <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-2 text-center">
          <p className="text-white/60 text-xs font-medium">Browse Public Rooms</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step config ──────────────────────────────────────────────────────────────

type Step = {
  emoji: string;
  label: string;
  title: string;
  desc: string;
  bg: string;
  glow: string;
  Ill: () => React.ReactElement;
};

const STEPS: Step[] = [
  {
    emoji: '👋',
    label: 'Welcome',
    title: 'Welcome to Fantasy Stocks!',
    desc: 'Compete with friends using real stock market data and virtual money. Build the best portfolio, climb the leaderboard, and prove your trading skills — no real money ever at risk.',
    bg: '#0a1628', glow: '#1a4a80',
    Ill: IllWelcome,
  },
  {
    emoji: '🏠',
    label: 'Create a Room',
    title: 'Create a Competition Room',
    desc: "Tap 'Create Room' from your dashboard. Give your room a name, set a starting cash amount (like $10,000), pick how long the competition runs, and choose a start time. Make it public or private.",
    bg: '#0a1a3d', glow: '#1530a0',
    Ill: IllCreateRoom,
  },
  {
    emoji: '🔗',
    label: 'Invite Friends',
    title: 'Invite Your Friends',
    desc: 'Every room gets a unique invite code. Share it with friends and they can join instantly. You can also browse and join any public room from the Rooms page — even ones that are already in progress.',
    bg: '#18103d', glow: '#4020a0',
    Ill: IllInvite,
  },
  {
    emoji: '🏆',
    label: 'Leaderboard',
    title: 'Track Live Rankings',
    desc: "The room's main page shows a live leaderboard ranked by total portfolio return. The more your stocks gain, the higher you climb. Refresh or wait — it updates automatically.",
    bg: '#251500', glow: '#805010',
    Ill: IllLeaderboard,
  },
  {
    emoji: '📈',
    label: 'Trade Stocks',
    title: 'Search and Trade Stocks',
    desc: "Head to the Trade tab in your room. Search any stock by name or ticker (AAPL, TSLA, NVDA...). Enter how many shares you want and hit Buy or Sell. The cost is deducted from your cash instantly.",
    bg: '#0a2010', glow: '#0a6030',
    Ill: IllTrade,
  },
  {
    emoji: '⏰',
    label: 'Queued Orders',
    title: 'Orders Queue After Hours',
    desc: "Stock markets aren't open 24/7. If you trade outside market hours, your order is queued automatically. It executes the next time markets open at the live price. Your cash is reserved until it fills.",
    bg: '#251200', glow: '#804010',
    Ill: IllPending,
  },
  {
    emoji: '💼',
    label: 'My Portfolio',
    title: 'Manage Your Portfolio',
    desc: 'The Portfolio tab shows all your holdings, their current value, and your total return. Tap Sell on any stock to sell shares. The proceeds go straight back to your cash balance.',
    bg: '#0a1f1f', glow: '#106060',
    Ill: IllPortfolio,
  },
  {
    emoji: '💬',
    label: 'Chat',
    title: 'Chat with Other Players',
    desc: "Use the Chat tab to talk strategy — or trash-talk — with everyone in the room. A red badge on the Chat tab shows how many unread messages you have so you never miss a thing.",
    bg: '#0d1245', glow: '#2035a0',
    Ill: IllChat,
  },
  {
    emoji: '🚀',
    label: "You're Ready!",
    title: "You're Ready to Trade!",
    desc: "That's everything! Create a room, invite friends, research stocks, trade smart, and climb to the top. Tap the ? button at any time to reopen this guide.",
    bg: '#1a1000', glow: '#806000',
    Ill: IllReady,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourGuide() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next');
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const done = localStorage.getItem(DONE_KEY);
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';
    if (!done && !isAuthPage) {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Listen for manual re-open
  useEffect(() => {
    const handler = () => { setStep(0); setAnimDir('next'); setVisible(true); setOpen(true); };
    window.addEventListener('open-tour', handler);
    return () => window.removeEventListener('open-tour', handler);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    localStorage.setItem(DONE_KEY, '1');
  }, []);

  const goTo = useCallback((i: number, dir: 'next' | 'prev') => {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setStep(i);
      setVisible(true);
    }, 150);
  }, []);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) goTo(step + 1, 'next');
    else finish();
  }, [step, goTo, finish]);

  const prev = useCallback(() => {
    if (step > 0) goTo(step - 1, 'prev');
  }, [step, goTo]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, next, prev, finish]);

  if (!mounted) return null;

  const current = STEPS[step];
  const IllComp = current.Ill;

  const floatButton = (
    <button
      onClick={() => { setStep(0); setAnimDir('next'); setVisible(true); setOpen(true); }}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-primary text-white font-black text-lg shadow-lg shadow-primary/40 hover:scale-110 hover:shadow-primary/60 transition-all flex items-center justify-center select-none"
      title="How to use Fantasy Stocks"
      aria-label="Open tour guide"
    >
      ?
    </button>
  );

  if (!open) {
    return createPortal(floatButton, document.body);
  }

  return createPortal(
    <>
      {floatButton}

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={finish}
      >
        {/* Card — stop propagation so clicking inside doesn't close */}
        <div
          className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Illustration panel ── */}
          <div
            className="md:w-[42%] flex items-center justify-center p-8 relative overflow-hidden min-h-[220px] md:min-h-0"
            style={{
              background: `radial-gradient(ellipse at 35% 25%, ${current.glow}bb, ${current.bg}ff)`,
              transition: 'background 0.4s ease',
            }}
          >
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            {/* Step label pill */}
            <div className="absolute top-4 left-4 bg-white/10 border border-white/15 rounded-full px-3 py-1">
              <p className="text-white/60 text-[9px] uppercase tracking-widest font-semibold">{current.label}</p>
            </div>

            <div
              className="relative z-10 w-full transition-all duration-150"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : `translateY(${animDir === 'next' ? '12px' : '-12px'})`,
              }}
            >
              <IllComp />
            </div>
          </div>

          {/* ── Content panel ── */}
          <div className="md:w-[58%] bg-surface flex flex-col p-7">
            {/* Top row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-muted uppercase tracking-widest">
                  {step + 1} / {STEPS.length}
                </span>
              </div>
              <button
                onClick={finish}
                className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
              >
                Skip tour
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step content */}
            <div
              className="flex-1 transition-all duration-150"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : `translateY(${animDir === 'next' ? '10px' : '-10px'})`,
              }}
            >
              <div className="text-4xl mb-3">{current.emoji}</div>
              <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">{current.title}</h2>
              <p className="text-muted-bright text-sm leading-relaxed">{current.desc}</p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 my-5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i, i > step ? 'next' : 'prev')}
                  aria-label={`Go to step ${i + 1}`}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === step
                      ? 'w-6 h-2 bg-primary'
                      : i < step
                      ? 'w-2 h-2 bg-primary/40 hover:bg-primary/60'
                      : 'w-2 h-2 bg-border hover:bg-border-bright'
                  )}
                />
              ))}
            </div>

            {/* Nav buttons */}
            <div className="flex gap-2.5">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-bright hover:text-foreground hover:border-border-bright transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
              >
                {step === STEPS.length - 1 ? (
                  <>
                    Start Trading
                    <span className="text-base">🚀</span>
                  </>
                ) : (
                  <>
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
