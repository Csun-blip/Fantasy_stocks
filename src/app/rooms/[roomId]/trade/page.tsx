'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import RoomNav from '@/components/room/RoomNav';
import StockSearch from '@/components/trading/StockSearch';
import TradeForm from '@/components/trading/TradeForm';
import PortfolioTable from '@/components/trading/PortfolioTable';
import PriceChart from '@/components/trading/PriceChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils';
import type { StockSearchResult, PortfolioSummary, Holding, PendingOrder } from '@/types';

export default function TradePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}/portfolio`);
    if (res.ok) setPortfolio(await res.json());
    setLoading(false);
  }, [roomId]);

  const fetchPending = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}/pending-orders`);
    if (res.ok) setPendingOrders(await res.json());
  }, [roomId]);

  useEffect(() => {
    fetchPortfolio();
    fetchPending();
  }, [fetchPortfolio, fetchPending]);

  function handleTradeSuccess(newBalance: number) {
    setPortfolio((prev) => prev ? { ...prev, cashBalance: newBalance } : prev);
    setTimeout(fetchPortfolio, 500);
  }

  function handlePendingOrderPlaced(order: PendingOrder, newBalance: number) {
    setPendingOrders((prev) => [...prev, order]);
    setPortfolio((prev) => prev ? { ...prev, cashBalance: newBalance } : prev);
  }

  function handleSell(holding: Holding) {
    setSellHolding(holding);
    setSelectedStock({ symbol: holding.symbol, name: holding.companyName, exchange: holding.exchange, type: 'EQUITY' });
  }

  async function cancelOrder(id: string) {
    const res = await fetch(`/api/rooms/${roomId}/pending-orders/${id}`, { method: 'DELETE' });
    if (res.ok) setPendingOrders((prev) => prev.filter((o) => o.id !== id));
  }

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href={`/rooms/${roomId}`} className="hover:text-foreground transition-colors">Back to Room</Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-4">Trade Stocks</h1>
      <RoomNav roomId={roomId} isMember={true} />

      {portfolio && (
        <div className="flex justify-end mb-6">
          <div className="text-right">
            <p className="text-xs text-muted">Available Cash</p>
            <p className="font-mono text-xl font-bold text-foreground">{formatCurrency(portfolio.cashBalance)}</p>
            <p className={`text-xs font-mono mt-0.5 ${portfolio.totalReturnPercent >= 0 ? 'text-success' : 'text-danger'}`}>
              Portfolio: {formatCurrency(portfolio.totalValue)} ({portfolio.totalReturnPercent >= 0 ? '+' : ''}{portfolio.totalReturnPercent.toFixed(2)}%)
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Search + Trade Form */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-medium text-foreground mb-4">Find a Stock</h2>
            <StockSearch
              onSelect={(stock) => {
                setSelectedStock(stock);
                setSellHolding(null);
              }}
            />
          </div>

          {selectedStock && portfolio && (
            <TradeForm
              roomId={roomId}
              stock={selectedStock}
              cashBalance={portfolio.cashBalance}
              onSuccess={handleTradeSuccess}
              onPendingOrder={handlePendingOrderPlaced}
              onCancel={() => { setSelectedStock(null); setSellHolding(null); }}
              ownedShares={portfolio.holdings.find((h) => h.symbol === selectedStock.symbol)?.quantity ?? 0}
            />
          )}

          {selectedStock && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <PriceChart symbol={selectedStock.symbol} />
            </div>
          )}

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="font-medium text-foreground mb-3">Queued Orders</h2>
              <div className="flex flex-col gap-2">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between bg-surface-raised rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.action === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {order.action}
                      </span>
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{order.symbol}</p>
                        <p className="text-xs text-muted">
                          {order.quantity} share{order.quantity !== 1 ? 's' : ''} at {formatCurrency(order.reservedPrice)}
                          {order.action === 'BUY' && ` · ${formatCurrency(order.reservedAmount)} reserved`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => cancelOrder(order.id)} className="text-xs text-danger hover:underline">
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Portfolio */}
        <div className="lg:col-span-3">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground">Your Holdings</h2>
              {portfolio && (
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-xs text-muted">Cash</p>
                    <p className="font-mono text-foreground">{formatCurrency(portfolio.cashBalance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Total Value</p>
                    <p className="font-mono font-semibold text-foreground">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                </div>
              )}
            </div>

            {portfolio && (
              <PortfolioTable
                holdings={portfolio.holdings}
                onSell={handleSell}
                canTrade={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
