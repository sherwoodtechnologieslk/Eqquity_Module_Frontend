import React from 'react';

export const FUNDS = [
  { id: 'EGF', name: 'Equity Growth Fund', category: 'Equity', nav: 25.45, currency: 'LKR' },
  { id: 'BIF', name: 'Balanced Income Fund', category: 'Balanced', nav: 18.92, currency: 'LKR' },
  { id: 'FIF', name: 'Fixed Income Fund', category: 'Fixed Income', nav: 10.25, currency: 'LKR' },
  { id: 'MMF', name: 'Money Market Fund', category: 'Money Market', nav: 1.0, currency: 'LKR' },
  { id: 'IDX', name: 'Index Fund', category: 'Equity', nav: 32.15, currency: 'LKR' },
];

export const CLIENTS = [
  { code: 'CLT-000128', name: 'Weerathungage Arani Sehansa', segment: 'Individual' },
  { code: 'CLT-000257', name: 'Omega Holdings (Pvt) Ltd', segment: 'Treasury' },
  { code: 'CLT-000389', name: 'Family Trust – Growth', segment: 'Private Wealth' },
  { code: 'CLT-000412', name: 'Nimal Perera – Retirement', segment: 'Individual' },
  { code: 'CLT-000441', name: 'Sunrise Foundation', segment: 'Trust / Foundation' },
];

export const CHANNELS = ['RM Assisted', 'Branch', 'Client Portal', 'Call Centre'];
export const PAYMENT_METHODS = ['Bank Transfer', 'Direct Debit', 'Cheque', 'Internal Transfer'];

export const formatMoney = (value, currency = 'LKR') =>
  `${currency} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)}`;

export const formatCompact = (value, currency = 'LKR') => {
  const abs = Math.abs(value || 0);
  const n =
    abs >= 1_000_000_000
      ? `${(value / 1_000_000_000).toFixed(2)}B`
      : abs >= 1_000_000
        ? `${(value / 1_000_000).toFixed(2)}M`
        : abs >= 1_000
          ? `${(value / 1_000).toFixed(1)}K`
          : new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0);
  return `${currency} ${n}`;
};

export const formatUnits = (value) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value || 0);

export const formatPct = (value) =>
  `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const statusClass = (status) =>
  `wos-badge wos-badge--${String(status || 'pending')
    .toLowerCase()
    .replace(/\s+/g, '-')}`;

export const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconSearch = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
    <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconDownload = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3v10m0 0 4-4m-4 4-4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
