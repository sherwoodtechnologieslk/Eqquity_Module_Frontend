import React, { memo } from 'react';

/**
 * Multi-symbol TradingView overview — loads inside an iframe (see
 * public/tradingview-sector-indices-overview.html) to avoid CRA "Script error."
 * overlays from injected third-party scripts on the main document.
 */
function TradingViewSectorIndicesWidget() {
  const src = `${process.env.PUBLIC_URL || ''}/tradingview-sector-indices-overview.html`;

  return (
    <iframe
      title="CSE sector indices — TradingView symbol overview"
      src={src}
      className="tradingview-sector-indices-iframe"
    />
  );
}

export default memo(TradingViewSectorIndicesWidget);
