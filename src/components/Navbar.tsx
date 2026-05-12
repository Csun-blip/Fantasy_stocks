'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setMenuOpen(false); }, [pathname]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + desktop nav */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-gold-bright flex items-center justify-center shadow-gold transition-shadow group-hover:shadow-[0_0_24px_rgba(212,175,55,0.3)]">
                  <svg className="w-5 h-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="font-bold text-lg gold-text">Fantasy Stocks</span>
              </Link>

              {session && (
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/dashboard" active={pathname === '/dashboard'}>Dashboard</NavLink>
                  <NavLink href="/rooms" active={pathname.startsWith('/rooms')}>Rooms</NavLink>
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* How to Play — desktop only */}
              <button
                onClick={() => window.dispatchEvent(new Event('open-tour'))}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-bright hover:text-foreground hover:bg-surface-raised transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
                How to Play
              </button>

              <ThemeToggle />

              {session ? (
                <>
                  {/* Desktop dropdown */}
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setMenuOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-raised transition-colors text-sm"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {(session.user.username || session.user.name || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-muted-bright font-medium">
                        {session.user.username || session.user.name}
                      </span>
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 mt-1 w-48 z-20 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
                          <div className="px-4 py-3 border-b border-border">
                            <p className="text-xs text-muted-bright">Signed in as</p>
                            <p className="text-sm font-semibold text-foreground truncate">{session.user.email}</p>
                          </div>
                          <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-bright hover:text-foreground hover:bg-surface-raised transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            Account Settings
                          </Link>
                          <button
                            onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-bright hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile: avatar + hamburger */}
                  <div className="flex items-center gap-1 md:hidden">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">
                        {(session.user.username || session.user.name || 'U')[0].toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileOpen((o) => !o)}
                      className="p-2 rounded-xl hover:bg-surface-raised transition-colors"
                      aria-label="Toggle menu"
                    >
                      {mobileOpen ? (
                        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm text-muted-bright hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-raised">
                    Log In
                  </Link>
                  <Link href="/register" className="text-sm btn-primary !py-1.5 !px-4">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {mobileOpen && session && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-50 bg-background border-b border-border shadow-2xl md:hidden">
            <div className="px-4 py-3 flex flex-col gap-1">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs text-muted">Signed in as</p>
                <p className="text-sm font-semibold text-foreground truncate">{session.user.email}</p>
              </div>

              <div className="h-px bg-border mb-1" />

              <MobileNavLink href="/dashboard" active={pathname === '/dashboard'}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </MobileNavLink>

              <MobileNavLink href="/rooms" active={pathname.startsWith('/rooms')}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Rooms
              </MobileNavLink>

              <button
                onClick={() => { setMobileOpen(false); window.dispatchEvent(new Event('open-tour')); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-bright hover:text-foreground hover:bg-surface-raised transition-colors text-left"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
                </svg>
                How to Play
              </button>

              <div className="h-px bg-border my-1" />

              <MobileNavLink href="/settings" active={pathname === '/settings'}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Account Settings
              </MobileNavLink>

              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/5 transition-colors text-left mb-1"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-surface-raised text-foreground' : 'text-muted-bright hover:text-foreground hover:bg-surface-raised'
      )}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        active ? 'bg-surface-raised text-foreground' : 'text-muted-bright hover:text-foreground hover:bg-surface-raised'
      )}
    >
      {children}
    </Link>
  );
}
