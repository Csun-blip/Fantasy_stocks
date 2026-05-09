'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { ChatMessageWithUser } from '@/types';

export default function ChatBox({ roomId }: { roomId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessageWithUser[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  async function fetchMessages(after?: string) {
    const url = `/api/chat/${roomId}${after ? `?after=${after}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data: ChatMessageWithUser[] = await res.json();
    if (data.length > 0) {
      if (after) {
        setMessages((prev) => [...prev, ...data]);
      } else {
        setMessages(data);
      }
      lastIdRef.current = data[data.length - 1].id;
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(() => {
      if (lastIdRef.current) fetchMessages(lastIdRef.current);
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const myName = session?.user?.username ?? session?.user?.name ?? 'You';
    const optimistic: ChatMessageWithUser = {
      id: `opt-${Date.now()}`,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      user: { id: session?.user?.id ?? '', username: myName, displayName: myName },
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    const res = await fetch(`/api/chat/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: optimistic.content }),
    });

    setSending(false);

    if (res.ok) {
      const real: ChatMessageWithUser = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? real : m)));
      lastIdRef.current = real.id;
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  function initials(username: string) {
    return username.slice(0, 2).toUpperCase();
  }

  function avatarColor(username: string) {
    const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];
    let hash = 0;
    for (const c of username) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted text-sm">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user.id === session?.user?.id;
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-foreground shrink-0 ${avatarColor(msg.user.displayName)}`}>
                {initials(msg.user.displayName)}
              </div>
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && <p className="text-xs text-muted">{msg.user.displayName}</p>}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm ${
                    isOwn
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-surface-raised border border-border text-foreground rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <p className="text-xs text-muted">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-border p-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          className="flex-1 bg-surface-raised border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
