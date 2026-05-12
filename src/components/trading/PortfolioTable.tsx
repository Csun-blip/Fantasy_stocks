'use client';

import { formatPercent } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import type { Holding, StopLossOrder } from '@/types';
import Badge from '@/components/ui/Badge';

interface PortfolioTableProps {
  holdings: Holding[];
  onSell?: (holding: Holding) => void;
  canTrade?: boolean;
  stopLosses?: StopLossOrder[];
  onCancelStopLoss?: (id: string) => void;
}

export default function PortfolioTable({ holdings, onSell, canTrade, stopLosses = [], onCancelStopLoss }: PortfolioTableProps) {
  const { format } = useCurrency();

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No holdings yet</p>
        <p className="text-xs mt-1">Buy stocks to start building your portfolio</p>
      </div>
    );
  }

  function exchangeBadgeVariant(exchange: string) {
    if (exchange === 'XETRA') return 'blue';
    if (exchange === 'GETTEX') return 'green';
    return 'gray';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-muted font-medium py-3 px-2 text-xs">Stock</th>
            <th className="text-right text-muted font-medium py-3 px-2 text-xs">Shares</th>
            <th className="text-right text-muted font-medium py-3 px-2 text-xs hidden sm:table-cell">Avg Cost</th>
            <th className="text-right text-muted font-medium py-3 px-2 text-xs">Price</th>
            <th className="text-right text-muted font-medium py-3 px-2 text-xs hidden sm:table-cell">Value</th>
            <th className="text-right text-muted font-medium py-3 px-2 text-xs">P&L</th>
            {canTrade && <th className="py-3 px-2" />}
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const sl = stopLosses.find((s) => s.symbol === h.symbol);
            return (
              <tr key={h.symbol} className="border-b border-border/50 hover:bg-surface-raised/50 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-mono font-semibold text-foreground text-xs">{h.symbol}</p>
                      <p className="text-muted text-xs line-clamp-1 max-w-[140px]">{h.companyName}</p>
                      {sl && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] bg-danger/10 border border-danger/25 text-danger px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            🛡 Stop {format(sl.triggerPrice)}
                          </span>
                          {onCancelStopLoss && (
                            <button
                              onClick={() => onCancelStopLoss(sl.id)}
                              className="text-[9px] text-muted hover:text-danger transition-colors leading-none"
                              title="Remove stop loss"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant={exchangeBadgeVariant(h.exchange)} className="hidden sm:flex">
                      {h.exchange}
                    </Badge>
                  </div>
                </td>
                <td className="py-3 px-2 text-right font-mono text-foreground text-xs">{h.quantity.toLocaleString()}</td>
                <td className="py-3 px-2 text-right font-mono text-muted text-xs hidden sm:table-cell">{format(h.avgCost)}</td>
                <td className="py-3 px-2 text-right font-mono text-foreground text-xs">{format(h.currentPrice)}</td>
                <td className="py-3 px-2 text-right font-mono font-semibold text-foreground text-xs hidden sm:table-cell">{format(h.marketValue)}</td>
                <td className="py-3 px-2 text-right">
                  <div className={h.gainLoss >= 0 ? 'text-success' : 'text-danger'}>
                    <p className="font-mono text-xs hidden sm:block">{format(h.gainLoss)}</p>
                    <p className="font-mono text-xs font-semibold">{formatPercent(h.gainLossPercent)}</p>
                  </div>
                </td>
                {canTrade && (
                  <td className="py-3 px-2">
                    <button
                      onClick={() => onSell?.(h)}
                      className="text-xs text-danger hover:bg-danger/10 px-2 py-1 rounded-lg transition-colors border border-danger/30 hover:border-danger"
                    >
                      Sell
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
