'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RoomNav from '@/components/room/RoomNav';
import PortfolioTable from '@/components/trading/PortfolioTable';
import TradeForm from '@/components/trading/TradeForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { PortfolioSummary, Holding } from '@/types';

export default function PortfolioPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);

  const fetchPortfolio = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}/portfolio`);
    if (res.ok) setPortfolio(await res.json());
    setLoading(false);
  }, [roomId]);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  function handleSellSuccess(newBalance: number) {
    setPortfolio((prev) => prev ? { ...prev, cashBalance: newBalance } : prev);
    setTimeout(fetchPortfolio, 500);
    setSellHolding(null);
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
        <SummaryCard label="Total Value" value={formatCurrency(portfolio.totalValue)} colored={false} />
        <SummaryCard label="Cash Balance" value={formatCurrency(portfolio.cashBalance)} colored={false} />
        <SummaryCard
          label="Total Return"
          value={`${portfolio.totalReturnPercent >= 0 ? '+' : ''}${formatCurrency(portfolio.totalReturn)}`}
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
            />
          </div>
        </div>

        {/* Sell panel */}
        {sellHolding && (
          <div className="lg:col-span-1">
            <TradeForm
              roomId={roomId}
              stock={{ symbol: sellHolding.symbol, name: sellHolding.companyName, exchange: sellHolding.exchange, type: 'EQUITY' }}
              cashBalance={portfolio.cashBalance}
              onSuccess={handleSellSuccess}
              onCancel={() => setSellHolding(null)}
              ownedShares={sellHolding.quantity}
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
  const valueColor = colored ? (positive ? 'text-success' : 'text-danger') : 'text-white';
  return (
    <div className="bg-surface border border-border rounded-2xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`font-mono font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
