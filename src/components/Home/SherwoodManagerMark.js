import React from 'react';

/**
 * Stacked SHERWOOD + EQUITY / WEALTH wordmark for sidebar (dark blue theme).
 * EQUITY/WEALTH is centered under SHERWOOD.
 */
export default function SherwoodManagerMark({ tier = 'equity', compact = false, className = '' }) {
  const sub = tier === 'wealth' ? 'WEALTH' : 'EQUITY';
  const label = tier === 'wealth' ? 'Sherwood Wealth' : 'Sherwood Equity';
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
