'use client';

import { useEffect } from 'react';
import { markChatSeen } from '@/hooks/useUnreadCount';

export default function ChatViewed({ roomId }: { roomId: string }) {
  useEffect(() => {
    markChatSeen(roomId);
  }, [roomId]);

  return null;
}
