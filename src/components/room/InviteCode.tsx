'use client';

import { useState } from 'react';

export default function InviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <code className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-foreground tracking-widest">
        {code}
      </code>
      <button
        onClick={copy}
        className="text-xs text-primary hover:text-primary-light transition-colors px-2 py-1 rounded hover:bg-surface-raised"
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}
