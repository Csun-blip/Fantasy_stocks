'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import type { StockQuote, StockSearchResult, PendingOrder, StopLossOrder } from '@/types';

interface TradeFormProps {
  roomId: string;
  stock: StockSearchResult;
  cashBalance: number;
  onSuccess: (newBalance: number) => void;
  onPendingOrder?: (order: PendingOrder, newBalance: number) => void;
  onStopLossSet?: (sl: StopLossOrder) => void;
  onCancel: () => void;
  ownedShares?: number;
  existingStopLoss?: StopLossOrder | null;
}

export default function TradeForm({
  roomId, stock, cashBalance, onSuccess, onPendingOrder, onStopLossSet,
  onCancel, ownedShares = 0, existingStopLoss,
}: TradeFormProps) {
  const { format } = useCurrency();
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [quantityStr, setQuantityStr] = useState('1');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Stop loss state
  const [slEnabled, setSlEnabled] = useState(false);
  const [slPriceStr, setSlPriceStr] = useState('');

  const quantity = Math.max(1, parseInt(quantityStr) || 1);
  const price = quote?.price ?? 0;
  const total = price * quantity;
  const canBuy = action === 'BUY' && cashBalance >= total && total > 0;
  const canSell = action === 'SELL' && ownedShares >= quantity && quantity > 0;
  const canSubmit = action === 'BUY' ? canBuy : canSell;

  // For SELL: stop loss applies to remaining shares after selling
  const remainingAfterSell = action === 'SELL' ? Math.max(0, ownedShares - quantity) : 0;
  const slApplicable = action === 'BUY' || (action === 'SELL' && remainingAfterSell > 0);

  // Stop loss qty: bought shares (BUY) or remaining shares (SELL)
  const slQty = action === 'BUY' ? quantity : remainingAfterSell;

  const slPrice = parseFloat(slPriceStr) || 0;
  const slValid = slPrice > 0 && slPrice < price;
  const slPercent = price > 0 && slPrice > 0 ? ((slPrice - price) / price * 100).toFixed(1) : null;

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

  // Reset stop loss when switching action
  useEffect(() => {
    setSlEnabled(false);
    setSlPriceStr('');
  }, [action]);

  function enableStopLoss() {
    setSlEnabled(true);
    if (!slPriceStr && price > 0) {
      setSlPriceStr((price * 0.95).toFixed(2));
    }
  }

  function normalizeQuantity() {
    const max = action === 'SELL' ? ownedShares : Infinity;
    const clamped = Math.min(max, Math.max(1, parseInt(quantityStr) || 1));
    setQuantityStr(String(clamped));
  }

  async function handleTrade() {
    if (!canSubmit) return;
    if (slEnabled && slPriceStr && !slValid) {
      setError('Stop loss price must be below the current price.');
      return;
    }
    setError('');
    setSuccess('');
    setTrading(true);

    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, symbol: stock.symbol, action, quantity }),
    });

    const data = await res.json();

    if (!res.ok) {
      setTrading(false);
      setError(data.error || 'Trade failed');
      return;
    }

    // Create stop loss if enabled and valid
    if (slEnabled && slValid && slQty > 0) {
      const slRes = await fetch(`/api/rooms/${roomId}/stop-loss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          companyName: stock.name,
          quantity: slQty,
          triggerPrice: slPrice,
        }),
      });
      if (slRes.ok) {
        const slData = await slRes.json();
        onStopLossSet?.(slData);
      }
    }

    setTrading(false);
    setSuccess(`${action === 'BUY' ? 'Bought' : 'Sold'} ${quantity} share${quantity > 1 ? 's' : ''} of ${stock.symbol}${slEnabled && slValid ? ' with stop loss set.' : '.'}`);
    onSuccess(data.newCashBalance);
    setQuantityStr('1');
    setSlEnabled(false);
    setSlPriceStr('');
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-mono font-semibold text-foreground">{stock.symbol}</h3>
          <p className="text-xs text-muted mt-0.5 line-clamp-1">{stock.name}</p>
        </div>
        <button onClick={onCancel} className="text-muted hover:text-foreground text-lg leading-none">✕</button>
      </div>

      {/* Quote */}
      {quoteLoading ? (
        <div className="h-12 skeleton rounded-xl" />
      ) : quote ? (
        <div className="bg-surface-raised rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-2xl font-bold text-foreground">{format(quote.price)}</p>
            <p className="text-xs text-muted">{quote.exchange} · {quote.marketState}</p>
          </div>
          <div className={`text-right ${quote.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
            <p className="font-mono text-sm font-medium">
              {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
            </p>
            <p className="font-mono text-xs">{quote.change >= 0 ? '+' : ''}{format(quote.change)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">
          Could not fetch live price
        </div>
      )}

      {/* BUY / SELL toggle */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {(['BUY', 'SELL'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              action === a
                ? a === 'BUY' ? 'bg-success text-white' : 'bg-danger text-white'
                : 'bg-surface-raised text-muted hover:text-foreground'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-muted-bright">Quantity</label>
        <div className="flex gap-2">
          <button
            onClick={() => setQuantityStr(String(Math.max(1, quantity - 1)))}
            className="bg-surface-raised border border-border rounded-xl w-10 h-10 text-foreground hover:bg-border transition-colors flex-shrink-0"
          >−</button>
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
          >+</button>
        </div>
        {action === 'SELL' && (
          <p className="text-xs text-muted">You own {ownedShares} share{ownedShares !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Trade summary */}
      <div className="bg-surface-raised rounded-xl p-3 flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Price per share</span>
          <span className="font-mono text-foreground">{format(price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total {action === 'BUY' ? 'cost' : 'proceeds'}</span>
          <span className="font-mono font-semibold text-foreground">{format(total)}</span>
        </div>
        {action === 'BUY' && (
          <div className="flex justify-between border-t border-border pt-2 mt-1">
            <span className="text-muted">Cash after trade</span>
            <span className={`font-mono font-semibold ${cashBalance - total < 0 ? 'text-danger' : 'text-success'}`}>
              {format(cashBalance - total)}
            </span>
          </div>
        )}
      </div>

      {/* ── Stop Loss ── */}
      {slApplicable && price > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header row — toggles open/close */}
          <button
            type="button"
            onClick={() => slEnabled ? setSlEnabled(false) : enableStopLoss()}
            className="w-full flex items-center justify-between px-4 py-3 bg-surface-raised hover:bg-border/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🛡</span>
              <span className="text-sm font-semibold text-foreground">Stop Loss</span>
              <span className="text-xs text-muted">optional</span>
              {existingStopLoss && !slEnabled && (
                <span className="text-[10px] bg-warning/20 text-warning border border-warning/30 px-1.5 py-0.5 rounded-full font-semibold">
                  Active: {format(existingStopLoss.triggerPrice)}
                </span>
              )}
            </div>
            {/* Toggle pill */}
            <div className={`w-9 h-5 rounded-full transition-colors relative ${slEnabled ? 'bg-primary' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${slEnabled ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
          </button>

          {slEnabled && (
            <div className="px-4 py-4 border-t border-border flex flex-col gap-3">
              <p className="text-xs text-muted-bright leading-relaxed">
                {action === 'BUY'
                  ? `Auto-sell these ${slQty} share${slQty !== 1 ? 's' : ''} if ${stock.symbol} price drops to or below:`
                  : `Auto-sell ${slQty} remaining share${slQty !== 1 ? 's' : ''} if ${stock.symbol} drops to or below:`
                }
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={slPriceStr}
                  onChange={(e) => setSlPriceStr(e.target.value)}
                  placeholder={price > 0 ? (price * 0.95).toFixed(2) : '0.00'}
                  className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-danger/40 focus:border-danger/50"
                />
                {slPercent && (
                  <div className={`text-xs font-mono font-bold shrink-0 px-2 py-1 rounded-lg ${
                    slValid ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                  }`}>
                    {slPercent}%
                  </div>
                )}
              </div>

              {slPriceStr && !slValid && (
                <p className="text-xs text-warning">
                  Stop loss price must be below the current price ({format(price)}).
                </p>
              )}

              {slValid && (
                <div className="bg-danger/8 border border-danger/20 rounded-xl px-3 py-2.5 text-xs text-danger/80 leading-relaxed">
                  If <strong className="text-danger">{stock.symbol}</strong> falls to{' '}
                  <strong className="text-danger font-mono">{format(slPrice)}</strong>, your{' '}
                  {slQty} share{slQty !== 1 ? 's' : ''} will be sold automatically to limit your losses.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="bg-success/10 border border-success/30 rounded-xl px-4 py-3 text-sm text-success">{success}</div>
      )}

      <Button
        onClick={handleTrade}
        loading={trading}
        disabled={!quote || !canSubmit}
        variant={action === 'BUY' ? 'success' : 'danger'}
        size="lg"
      >
        {action === 'BUY'
          ? `Buy ${quantity} Share${quantity > 1 ? 's' : ''}${slEnabled && slValid ? ' + Set Stop Loss' : ''}`
          : `Sell ${quantity} Share${quantity > 1 ? 's' : ''}${slEnabled && slValid && remainingAfterSell > 0 ? ' + Set Stop Loss' : ''}`
        }
      </Button>
    </div>
  );
}
