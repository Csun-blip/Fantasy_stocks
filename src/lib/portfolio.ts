import type { Trade } from '@prisma/client';
import { getBatchQuotes } from './yahoo-finance';
import type { Holding, PortfolioSummary } from '@/types';

export interface RawHolding {
  symbol: string;
  companyName: string;
  exchange: string;
  quantity: number;
  totalCost: number;
  avgCost: number;
}

export function computeHoldingsFromTrades(trades: Trade[]): RawHolding[] {
  const map = new Map<string, { qty: number; cost: number; name: string; exchange: string }>();

  for (const t of trades) {
    const entry = map.get(t.symbol) ?? { qty: 0, cost: 0, name: t.companyName, exchange: t.exchange };
    if (t.action === 'BUY') {
      entry.qty += t.quantity;
      entry.cost += t.totalValue;
    } else {
      // SELL: reduce proportionally
      const avgCostBefore = entry.qty > 0 ? entry.cost / entry.qty : 0;
      entry.qty -= t.quantity;
      entry.cost -= avgCostBefore * t.quantity;
    }
    entry.name = t.companyName;
    entry.exchange = t.exchange;
    map.set(t.symbol, entry);
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.qty > 0)
    .map(([symbol, v]) => ({
      symbol,
      companyName: v.name,
      exchange: v.exchange,
      quantity: Math.round(v.qty * 1000) / 1000,
      totalCost: v.cost,
      avgCost: v.qty > 0 ? v.cost / v.qty : 0,
    }));
}

export async function buildPortfolioSummary(
  trades: Trade[],
  cashBalance: number,
  startingCash: number,
  reservedCash = 0
): Promise<PortfolioSummary> {
  const rawHoldings = computeHoldingsFromTrades(trades);
  const symbols = rawHoldings.map((h) => h.symbol);
  const prices = await getBatchQuotes(symbols);

  const holdings: Holding[] = rawHoldings.map((h) => {
    const quote = prices.get(h.symbol);
    const currentPrice = quote?.price ?? h.avgCost;
    const marketValue = currentPrice * h.quantity;
    const gainLoss = marketValue - h.totalCost;
    const gainLossPercent = h.totalCost > 0 ? (gainLoss / h.totalCost) * 100 : 0;

    return {
      symbol: h.symbol,
      companyName: h.companyName,
      exchange: h.exchange,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice,
      marketValue,
      gainLoss,
      gainLossPercent,
    };
  });

  const holdingsValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalValue = holdingsValue + cashBalance + reservedCash;
  const totalReturn = totalValue - startingCash;
  const totalReturnPercent = startingCash > 0 ? (totalReturn / startingCash) * 100 : 0;

  return {
    cashBalance,
    holdings,
    totalValue,
    startingCash,
    totalReturn,
    totalReturnPercent,
  };
}
