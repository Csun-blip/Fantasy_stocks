'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { cn } from '@/lib/utils';

export default function RoomNav({ roomId, isMember, hasStarted = true }: { roomId: string; isMember: boolean; hasStarted?: boolean }) {
  const pathname = usePathname();
  const unread = useUnreadCount(roomId);

  if (!isMember) return null;

  const tabs = [
    { href: `/rooms/${roomId}`, label: 'Leaderboard', badge: 0, show: true },
    { href: `/rooms/${roomId}/portfolio`, label: 'My Portfolio', badge: 0, show: true },
    { href: `/rooms/${roomId}/trade`, label: 'Trade', badge: 0, show: hasStarted },
    { href: `/rooms/${roomId}/chat`, label: 'Chat', badge: unread, show: true },
  ];

  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
      {tabs.filter((t) => t.show).map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'relative px-4 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap',
              active
                ? 'bg-primary border-primary text-white'
                : 'bg-surface-raised border-border text-foreground hover:border-primary/50'
            )}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none shadow-lg">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
