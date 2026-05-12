export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  currency: string;
  marketState?: string;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  previousClose?: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface Holding {
  symbol: string;
  companyName: string;
  exchange: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioSummary {
  cashBalance: number;
  holdings: Holding[];
  totalValue: number;
  startingCash: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;  // nickname if set, otherwise username
  totalValue: number;
  cashBalance: number;
  startingCash: number;
  returnAmount: number;
  returnPercent: number;
  tradeCount: number;
  isCurrentUser: boolean;
}

export interface RoomWithMeta {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  inviteCode: string;
  startingCash: number;
  duration: string;
  startsAt: string;
  endsAt: string;
  isExpired: boolean;
  createdById: string;
  memberCount: number;
  isMember: boolean;
  isActive: boolean;
}

export interface ChatMessageWithUser {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;  // nickname if set in this room, otherwise username
  };
}

export interface PendingOrder {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  action: string;
  quantity: number;
  reservedAmount: number;
  reservedPrice: number;
  createdAt: string;
}

export interface StopLossOrder {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  quantity: number;
  triggerPrice: number;
  createdAt: string;
}

export interface PriceHistoryPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}
