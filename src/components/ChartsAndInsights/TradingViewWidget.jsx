import React, { memo } from 'react';

/**
 * TradingView must load inside an iframe (see public/tradingview-symbol-overview.html).
 * Injected scripts on the main React document trigger CRA's "Script error." overlay.
 * Edit chart options in that HTML file (cfg object in the inline script).
 */
function TradingViewWidget() {
  const src = `${process.env.PUBLIC_URL || ''}/tradingview-symbol-overview.html`;

  return (
    <iframe
      title="CSE ASI — TradingView symbol overview"
      src={src}
      className="tradingview-symbol-overview-iframe"
    />
  );
}

export default memo(TradingViewWidget);
