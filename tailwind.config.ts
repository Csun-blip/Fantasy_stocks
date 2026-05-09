import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-high': 'var(--color-surface-high)',
        border: 'var(--color-border)',
        'border-bright': 'var(--color-border-bright)',
        foreground: 'var(--color-foreground)',
        muted: 'var(--color-muted)',
        'muted-bright': 'var(--color-muted-bright)',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          light: '#60a5fa',
        },
        gold: {
          DEFAULT: '#d4af37',
          bright: '#fbbf24',
          dim: '#9a7d1a',
          glow: 'rgba(212,175,55,0.15)',
        },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
        'ticker': 'ticker 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.75' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212,175,55,0.15), 0 0 40px rgba(212,175,55,0.05)',
        'card': '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(59,130,246,0.15)',
        'glow-green': '0 0 20px rgba(16,185,129,0.2)',
        'glow-red': '0 0 20px rgba(239,68,68,0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
