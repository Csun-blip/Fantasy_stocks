'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomStartWatcher({ startsAt }: { startsAt: string }) {
  const router = useRouter();

  useEffect(() => {
    const msUntilStart = new Date(startsAt).getTime() - Date.now();
    if (msUntilStart <= 0) return; // already started

    const timer = setTimeout(() => {
      router.refresh(); // re-fetch server data so hasStarted becomes true
    }, msUntilStart + 500); // +500ms buffer for clock skew

    return () => clearTimeout(timer);
  }, [startsAt, router]);

  return null;
}
