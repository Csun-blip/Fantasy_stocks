'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RoomNav from '@/components/room/RoomNav';
import PortfolioTable from '@/components/trading/PortfolioTable';
import TradeForm from '@/components/trading/TradeForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatPercent } from '@/lib/utils';
import { useCurrency } from '@/context/CurrencyContext';
import type { PortfolioSummary, Holding, PendingOrder, StopLossOrder } from '@/types';

export default function PortfolioPage() {
  const { format } = useCurrency();
  const { roomId } = useParams<{ roomId: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [stopLosses, setStopLosses] = useState<StopLossOrder[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchStopLosses = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}/stop-loss`);
    if (res.ok) setStopLosses(await res.json());
  }, [roomId]);

  useEffect(() => {
    fetchPortfolio();
    fetchPending();
    fetchStopLosses();
  }, [fetchPortfolio, fetchPending, fetchStopLosses]);

  function handleSellSuccess(newBalance: number) {
    setPortfolio((prev) => prev ? { ...prev, cashBalance: newBalance } : prev);
    setTimeout(fetchPortfolio, 500);
    setSellHolding(null);
  }

  function handlePendingOrderPlaced(order: PendingOrder, newBalance: number) {
    setPendingOrders((prev) => [...prev, order]);
    setPortfolio((prev) => prev ? { ...prev, cashBalance: newBalance } : prev);
    setSellHolding(null);
  }

  async function cancelOrder(id: string) {
    const res = await fetch(`/api/rooms/${roomId}/pending-orders/${id}`, { method: 'DELETE' });
    if (res.ok) setPendingOrders((prev) => prev.filter((o) => o.id !== id));
  }

  async function cancelStopLoss(id: string) {
    const res = await fetch(`/api/rooms/${roomId}/stop-loss/${id}`, { method: 'DELETE' });
    if (res.ok) setStopLosses((prev) => prev.filter((s) => s.id !== id));
  }

  function handleStopLossSet(sl: StopLossOrder) {
    setStopLosses((prev) => {
      const filtered = prev.filter((s) => s.symbol !== sl.symbol);
      return [...filtered, sl];
    });
  }

  if (loading) return <LoadingSpinner className="py-20" />;
  if (!portfolio) return <div className="text-center py-20 text-muted">Not a member of this room.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-2">
        <Link href={`/rooms/${roomId}`} className="hover:text-foreground transition-colors">← Back to Room</Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-4">My Portfolio</h1>
      <RoomNav roomId={roomId} isMember={true} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Value" value={format(portfolio.totalValue)} colored={false} />
        <SummaryCard label="Cash Balance" value={format(portfolio.cashBalance)} colored={false} />
        <SummaryCard
          label="Total Return"
          value={`${portfolio.totalReturnPercent >= 0 ? '+' : ''}${format(portfolio.totalReturn)}`}
          positive={portfolio.totalReturn >= 0}
          colored
        />
        <SummaryCard
          label="Return %"
          value={formatPercent(portfolio.totalReturnPercent)}
          positive={portfolio.totalReturnPercent >= 0}
          colored
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings */}
        <div className={sellHolding ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground">Holdings</h2>
              <Link href={`/rooms/${roomId}/trade`} className="text-sm text-primary hover:underline">
                Buy →
              </Link>
            </div>
            <PortfolioTable
              holdings={portfolio.holdings}
              canTrade={true}
              onSell={(h) => setSellHolding(h)}
              stopLosses={stopLosses}
              onCancelStopLoss={cancelStopLoss}
            />
          </div>

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-6 mt-4">
              <h2 className="font-medium text-foreground mb-4">Pending Orders</h2>
              <div className="flex flex-col gap-2">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between bg-surface-raised rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.action === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                        {order.action}
                      </span>
                      <div>
                        <p className="font-mono text-sm font-semibold text-foreground">{order.symbol}</p>
                        <p className="text-xs text-muted">
                          {order.quantity} share{order.quantity !== 1 ? 's' : ''} at {format(order.reservedPrice)} each
                          {order.action === 'BUY' && ` · ${format(order.reservedAmount)} reserved`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-xs text-danger hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sell panel */}
        {sellHolding && (
          <div className="lg:col-span-1">
            <TradeForm
              roomId={roomId}
              stock={{ symbol: sellHolding.symbol, name: sellHolding.companyName, exchange: sellHolding.exchange, type: 'EQUITY' }}
              cashBalance={portfolio.cashBalance}
              onSuccess={handleSellSuccess}
              onPendingOrder={handlePendingOrderPlaced}
              onStopLossSet={handleStopLossSet}
              onCancel={() => setSellHolding(null)}
              ownedShares={sellHolding.quantity}
              existingStopLoss={stopLosses.find((s) => s.symbol === sellHolding.symbol) ?? null}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, colored, positive }: {
  label: string;
  value: string;
  colored: boolean;
  positive?: boolean;
}) {
  const valueColor = colored ? (positive ? 'text-success' : 'text-danger') : 'text-foreground';
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`font-mono font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
