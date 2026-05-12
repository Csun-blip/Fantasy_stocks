'use client';

import { useState } from 'react';

export default function InviteCode({ code }: { code: string }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  async function copyLink() {
    const link = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Code row */}
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 font-mono text-sm text-foreground tracking-widest">
          {code}
        </code>
        <button
          onClick={copyCode}
          className="text-xs text-primary hover:text-primary-light transition-colors px-2 py-1 rounded hover:bg-surface-raised shrink-0"
        >
          {copiedCode ? '✓ Copied' : 'Copy Code'}
        </button>
      </div>

      {/* Invite link button */}
      <button
        onClick={copyLink}
        className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl border transition-colors ${
          copiedLink
            ? 'bg-success/15 border-success/30 text-success'
            : 'bg-surface-raised border-border text-muted-bright hover:border-primary/40 hover:text-primary'
        }`}
      >
        {copiedLink ? (
          <>✓ Link Copied!</>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Copy Invite Link
          </>
        )}
      </button>
    </div>
  );
}
