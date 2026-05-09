'use client';

import { useState, useEffect } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function RoomTimer({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Room Ended');
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      if (days > 0) {
        setRemaining(`${days}d ${pad(hours)}h ${pad(minutes)}m`);
      } else {
        setRemaining(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isEnded = remaining === 'Room Ended';

  return (
    <div className={`flex items-center gap-2 font-mono text-sm ${isEnded ? 'text-muted' : 'text-warning'}`}>
      {!isEnded && (
        <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse" />
      )}
      {remaining || '—'}
    </div>
  );
}
