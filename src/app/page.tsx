import Link from 'next/link';

const FEATURES = [
  {
    icon: '📈',
    title: 'Live German Stock Data',
    desc: 'Real-time prices from Xetra and Gettex exchanges — the same data professional traders use.',
  },
  {
    icon: '🏆',
    title: 'Compete in Rooms',
    desc: 'Create private or public rooms, invite friends, and battle it out on the leaderboard.',
  },
  {
    icon: '⏱️',
    title: 'Flexible Timeframes',
    desc: 'Run competitions from 1 week to 5 years. Perfect for short sprints or long-term strategies.',
  },
  {
    icon: '💬',
    title: 'Room Chat',
    desc: 'Discuss trades and strategy with other players in real-time room chat.',
  },
  {
    icon: '📧',
    title: 'Email Results',
    desc: 'Get notified by email when your competition ends with the final leaderboard.',
  },
  {
    icon: '🎯',
    title: 'Risk-Free Learning',
    desc: 'Practice investing with up to €100,000 virtual money. No real money at stake.',
  },
];

const STEPS = [
  { step: '1', title: 'Create an account', desc: 'Sign up in seconds with your email.' },
  { step: '2', title: 'Create or join a room', desc: 'Set your starting capital and competition length.' },
  { step: '3', title: 'Trade German stocks', desc: 'Search and buy/sell stocks from Xetra & Gettex.' },
  { step: '4', title: 'Climb the leaderboard', desc: 'The best portfolio value wins when time is up.' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-success/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5 mb-6 text-sm text-muted">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live data from Xetra & Gettex
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6 leading-tight">
            Trade German Stocks.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-success">
              Without the Risk.
            </span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Compete with friends using virtual money on real Xetra and Gettex prices. Create rooms, set your timeframe, and see who builds the best portfolio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25"
            >
              Start for Free →
            </Link>
            <Link
              href="/rooms"
              className="bg-surface border border-border hover:border-primary/50 text-foreground px-8 py-4 rounded-2xl font-semibold text-lg transition-colors"
            >
              Browse Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-border bg-surface/50">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { label: 'Starting Capital', value: '€1K – €100K' },
            { label: 'Max Duration', value: '5 Years' },
            { label: 'Live Exchanges', value: 'Xetra & Gettex' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">Everything you need to compete</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-surface border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-surface/50 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How it works</h2>
          <div className="flex flex-col gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-foreground shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted mt-1">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to start trading?</h2>
          <p className="text-muted mb-8">Join and compete using live German stock market data.</p>
          <Link
            href="/register"
            className="inline-block bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted">
        <p>Fantasy Stocks — Virtual trading with real German market data. Not financial advice.</p>
        <p className="mt-1">Data via Yahoo Finance (Xetra .DE / Gettex .MU)</p>
      </footer>
    </div>
  );
}
