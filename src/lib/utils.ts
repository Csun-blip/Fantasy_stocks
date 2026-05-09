import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function durationToDays(duration: string): number {
  const map: Record<string, number> = {
    '1w': 7,
    '2w': 14,
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
  };
  return map[duration] ?? 30;
}

export function durationLabel(duration: string): string {
  const map: Record<string, string> = {
    '1w': '1 Week',
    '2w': '2 Weeks',
    '1m': '1 Month',
    '3m': '3 Months',
    '6m': '6 Months',
    '1y': '1 Year',
    '2y': '2 Years',
    '5y': '5 Years',
  };
  return map[duration] ?? duration;
}

export function timeRemaining(endsAt: Date | string): string {
  const end = new Date(endsAt);
  const now = new Date();
  if (end <= now) return 'Ended';
  return formatDistanceToNow(end, { addSuffix: true });
}

export function isRoomActive(endsAt: Date | string): boolean {
  return new Date(endsAt) > new Date();
}

export function symbolToExchange(symbol: string): string {
  if (symbol.endsWith('.DE')) return 'XETRA';
  if (symbol.endsWith('.MU')) return 'GETTEX';
  if (symbol.endsWith('.F')) return 'FRANKFURT';
  return 'UNKNOWN';
}
