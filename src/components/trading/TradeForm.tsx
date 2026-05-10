'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import type { StockQuote, StockSearchResult } from '@/types';

interface TradeFormProps {
  roomId: string;
  stock: StockSearchResult;
  cashBalance: number;
  onSuccess: (newBalance: number) => void;
  onCancel: () => void;
  ownedShares?: number;
}

export default function TradeForm({ roomId, stock, cashBalance, onSuccess, onCancel, ownedShares = 0 }: TradeFormProps) {
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantityStr, setQuantityStr] = useState('1');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const quantity = Math.max(1, parseInt(quantityStr) || 1);
  const isMarketOpen = quote?.marketState === 'REGULAR';

  function marketStateLabel(state: string): string {
    if (state === 'PRE') return 'in pre-market hours';
    if (state === 'POST') return 'in after-hours trading';
    return 'closed';
  }

  useEffect(() => {
    async function fetchQuote() {
      setQuoteLoading(true);
      const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(stock.symbol)}`);
      if (res.ok) setQuote(await res.json());
      setQuoteLoading(false);
    }
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [stock.symbol]);

  const price = quote?.price ?? 0;
  const total = price * quantity;
  const canBuy = action === 'BUY' && cashBalance >= total && total > 0;
  const canSell = action === 'SELL' && ownedShares >= quantity && quantity > 0;
  const canSubmit = action === 'BUY' ? canBuy : canSell;

  function normalizeQuantity() {
    const max = action === 'SELL' ? ownedShares : Infinity;
    const clamped = Math.min(max, Math.max(1, parseInt(quantityStr) || 1));
    setQuantityStr(String(clamped));
  }

  async function handleTrade() {
    if (!canSubmit || !isMarketOpen) return;
    setError('');
    setSuccess('');
    setTrading(true);

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, symbol: stock.symbol, action, quantity }),
    });

    const data = await res.json();
    setTrading(false);

    if (!res.ok) {
      setError(data.error || 'Trade failed');
    } else {
      setSuccess(`${action === 'BUY' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.symbol}`);
      onSuccess(data.newCashBalance);
      setQuantityStr('1');
    }
  }

  async function handlePendingOrder() {
    if (!canSubmit) return;
    setError('');
    setSuccess('');
    setTrading(true);

    const res = await fetch(`/api/rooms/${roomId}/pending-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: stock.symbol, companyName: stock.name, action, quantity }),
    });

    const data = await res.json();
    setTrading(false);

    if (!res.ok) {
      setError(data.error || 'Failed to queue order');
    } else {
      setSuccess(`Order queued. Will execute when the market opens for ${stock.symbol}.`);
      onSuccess(cashBalance);
      setQuantityStr('1');
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-mono font-semibold text-foreground">{stock.symbol}</h3>
          <p className="text-xs text-muted mt-0.5 line-clamp-1">{stock.name}</p>
        </div>
        <button onClick={onCancel} className="text-muted hover:text-foreground text-lg leading-none">✕</button>
      </div>

      {quoteLoading ? (
        <div className="h-12 skeleton rounded-xl" />
      ) : quote ? (
        <>
          <div className="bg-surface-raised rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-2xl font-bold text-foreground">{formatCurrency(quote.price)}</p>
              <p className="text-xs text-muted">{quote.exchange} · {quote.marketState}</p>
            </div>
            <div className={`text-right ${quote.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
              <p className="font-mono text-sm font-medium">
                {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
              </p>
              <p className="font-mono text-xs">{quote.change >= 0 ? '+' : ''}{formatCurrency(quote.change)}</p>
            </div>
          </div>

          {!isMarketOpen && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 text-sm text-warning">
              Market is currently <strong>{marketStateLabel(quote.marketState ?? 'closed')}</strong>. Orders will be queued and executed automatically when the market opens.
            </div>
          )}
        </>
      ) : (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
          Could not fetch live price
        </div>
      )}

      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['BUY', 'SELL'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              action === a
                ? a === 'BUY'
                  ? 'bg-success text-white'
                  : 'bg-danger text-white'
                : 'bg-surface-raised text-muted hover:text-foreground'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Quantity</label>
        <div className="flex gap-2">
          <button
            onClick={() => setQuantityStr(String(Math.max(1, quantity - 1)))}
            className="bg-surface-raised border border-border rounded-xl w-10 h-10 text-foreground hover:bg-border transition-colors flex-shrink-0"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={action === 'SELL' ? ownedShares : undefined}
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            onBlur={normalizeQuantity}
            className="flex-1 bg-surface-raised border border-border rounded-xl px-4 py-2 text-center text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => setQuantityStr(String(quantity + 1))}
            className="bg-surface-raised border border-border rounded-xl w-10 h-10 text-foreground hover:bg-border transition-colors flex-shrink-0"
          >
            +
          </button>
        </div>
        {action === 'SELL' && (
          <p className="text-xs text-muted">You own {ownedShares} share{ownedShares !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="bg-surface-raised rounded-xl p-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Price per share</span>
          <span className="font-mono text-foreground">{formatCurrency(price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total {action === 'BUY' ? 'cost' : 'proceeds'}</span>
          <span className="font-mono font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>
        {action === 'BUY' && (
          <div className="flex justify-between border-t border-border pt-2 mt-1">
            <span className="text-muted">Cash after trade</span>
            <span className={`font-mono font-semibold ${cashBalance - total < 0 ? 'text-danger' : 'text-success'}`}>
              {formatCurrency(cashBalance - total)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-sm text-success">{success}</div>
      )}

      {isMarketOpen ? (
        <Button
          onClick={handleTrade}
          loading={trading}
          disabled={!quote || !canSubmit}
          variant={action === 'BUY' ? 'success' : 'danger'}
          size="lg"
        >
          {action === 'BUY' ? `Buy ${quantity} Share${quantity > 1 ? 's' : ''}` : `Sell ${quantity} Share${quantity > 1 ? 's' : ''}`}
        </Button>
      ) : (
        <Button
          onClick={handlePendingOrder}
          loading={trading}
          disabled={!quote || !canSubmit}
          variant={action === 'BUY' ? 'success' : 'danger'}
          size="lg"
        >
          {action === 'BUY' ? `Queue Buy ${quantity} Share${quantity > 1 ? 's' : ''}` : `Queue Sell ${quantity} Share${quantity > 1 ? 's' : ''}`}
        </Button>
      )}
    </div>
  );
}
