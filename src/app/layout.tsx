import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Fantasy Stocks — Trade German Markets Virtually',
  description: 'Compete with friends using virtual money on real German stock exchange data from Xetra and Gettex. Create rooms, trade live stocks, climb the leaderboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme on load */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');})()` }} />
      </head>
      <body className="antialiased min-h-screen">
        <SessionProvider>
          {/* Decorative background orbs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
            <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gold/5 blur-[100px] glow-pulse" />
            <div className="absolute top-1/3 -right-40 w-72 h-72 rounded-full bg-primary/5 blur-[100px] glow-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute bottom-0 left-1/3 w-96 h-64 rounded-full bg-success/4 blur-[120px] glow-pulse" style={{ animationDelay: '4s' }} />
          </div>

          <Navbar />
          <main className="pt-16 relative z-10">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
