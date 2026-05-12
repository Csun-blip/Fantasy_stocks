'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CurrencyConfig = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
};

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', name: 'US Dollar',        symbol: '$',  flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',             symbol: '€',  flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',    symbol: '£',  flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen',     symbol: '¥',  flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc',      symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar',  symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar',symbol: 'A$', flag: '🇦🇺' },
  { code: 'INR', name: 'Indian Rupee',     symbol: '₹',  flag: '🇮🇳' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'CNY', name: 'Chinese Yuan',     symbol: '¥',  flag: '🇨🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩',  flag: '🇰🇷' },
  { code: 'BRL', name: 'Brazilian Real',   symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso',     symbol: '$',  flag: '🇲🇽' },
  { code: 'NOK', name: 'Norwegian Krone',  symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', name: 'Swedish Krona',    symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
];

const NO_DECIMAL = new Set(['JPY', 'KRW']);

export function formatCurrencyCode(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: NO_DECIMAL.has(currency) ? 0 : 2,
    maximumFractionDigits: NO_DECIMAL.has(currency) ? 0 : 2,
  }).format(amount);
}

type CurrencyCtx = {
  currency: string;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: string) => void;
  format: (amount: number) => string;
  currencies: CurrencyConfig[];
};

const defaultCurrency = CURRENCIES[0]; // USD

const CurrencyContext = createContext<CurrencyCtx>({
  currency: 'USD',
  currencyConfig: defaultCurrency,
  setCurrency: () => {},
  format: (n) => formatCurrencyCode(n, 'USD'),
  currencies: CURRENCIES,
});

const STORAGE_KEY = 'fs_currency';
const COOKIE_NAME = 'fs_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && CURRENCIES.find((c) => c.code === saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
    // Sync to cookie so server components can read it on next navigation
    document.cookie = `${COOKIE_NAME}=${code}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const format = useCallback(
    (amount: number) => formatCurrencyCode(amount, currency),
    [currency]
  );

  const currencyConfig = CURRENCIES.find((c) => c.code === currency) ?? defaultCurrency;

  return (
    <CurrencyContext.Provider value={{ currency, currencyConfig, setCurrency, format, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
