'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const storageKey = (roomId: string) => `chat_last_seen_${roomId}`;

function getLastSeen(roomId: string): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(storageKey(roomId)) ?? '0', 10);
}

export function markChatSeen(roomId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(roomId), Date.now().toString());
  window.dispatchEvent(new CustomEvent('chat-seen', { detail: { roomId } }));
}

export function useUnreadCount(roomId: string) {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const lastSeen = getLastSeen(roomId);
      const res = await fetch(`/api/chat/${roomId}`);
      if (!res.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const messages: any[] = await res.json();
      const unread = messages.filter(
        (m) => new Date(m.createdAt).getTime() > lastSeen && m.user?.id !== session?.user?.id
      ).length;
      setCount(unread);
    } catch {
      // network failure — keep existing count
    }
  }, [roomId, session?.user?.id]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    function onSeen(e: Event) {
      const detail = (e as CustomEvent<{ roomId: string }>).detail;
      if (detail.roomId === roomId) setCount(0);
    }
    window.addEventListener('chat-seen', onSeen);
    return () => window.removeEventListener('chat-seen', onSeen);
  }, [roomId]);

  return count;
}
