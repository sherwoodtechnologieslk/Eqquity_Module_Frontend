import React from 'react';

/**
 * Stacked SHERWOOD + EQUITY / WEALTH / TREASURY wordmark for sidebar (dark blue theme).
 * Sub-line is centered under SHERWOOD.
 */
export default function SherwoodManagerMark({ tier = 'equity', compact = false, className = '' }) {
  const sub =
    tier === 'wealth' ? 'WEALTH' : tier === 'treasury' ? 'TREASURY' : 'EQUITY';
  const label =
    tier === 'wealth'
      ? 'Sherwood Wealth'
      : tier === 'treasury'
        ? 'Sherwood Treasury'
        : 'Sherwood Equity';
  return (
    <div
      className={`sherwood-mark sherwood-mark--${tier} ${compact ? 'sherwood-mark--compact' : ''} ${className}`.trim()}
      aria-label={label}
    >
      <div className="sherwood-mark__inner">
        <span className="sherwood-mark__line1">SHERWOOD</span>
        <span className="sherwood-mark__line2">{sub}</span>
      </div>
    </div>
  );
}
