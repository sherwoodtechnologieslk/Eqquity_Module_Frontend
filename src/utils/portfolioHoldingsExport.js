// Shared portfolio holdings calculation for export.
// Mirrors the math used in `TradeCapture/PortfolioDropdown` so exported
// holdings match the on-screen table.

export const buildHoldingsFromTransactions = (buyTransactions, sellTransactions) => {
  const normalize = (v) => String(v || '').toLowerCase().trim();

  const groupMap = new Map();

  const getKey = (tx) => {
    const symbol = normalize(tx.symbol);
    const name = normalize(tx.company_name || tx.companyName || tx.company);
    const equityId = tx.equity_id || tx.equityId || '';
    return symbol || name || String(equityId) || 'unknown';
  };

  const getDisplayName = (tx, key) => {
    const candidate = tx.company_name || tx.companyName || tx.company || tx.symbol || key;
    return String(candidate || key).trim() || 'Unknown';
  };

  (buyTransactions || []).forEach((tx) => {
    const key = getKey(tx);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, displayName: getDisplayName(tx, key), buys: [], sells: [] });
    }
    groupMap.get(key).buys.push(tx);
  });

  (sellTransactions || []).forEach((tx) => {
    const key = getKey(tx);
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, displayName: getDisplayName(tx, key), buys: [], sells: [] });
    }
    groupMap.get(key).sells.push(tx);
  });

  const holdings = Array.from(groupMap.values())
    .map((g) => {
      const totalBuyQuantity = g.buys.reduce((sum, tx) => sum + (parseFloat(tx.quantity) || 0), 0);
      const totalBuyGrossValue = g.buys.reduce((sum, tx) => sum + (parseFloat(tx.gross_value) || 0), 0);
      const totalSellQuantity = g.sells.reduce((sum, tx) => sum + (parseFloat(tx.quantity) || 0), 0);

      const calculatedNetQuantity = Math.max(0, totalBuyQuantity - totalSellQuantity);
      const wap = totalBuyQuantity > 0 ? totalBuyGrossValue / totalBuyQuantity : 0;
      const calculatedCostValue = calculatedNetQuantity * wap;

      const totalBuyCharges = g.buys.reduce((sum, tx) => {
        const brokerage = parseFloat(tx.brokerage) || 0;
        const cdsFees = parseFloat(tx.cds_fees) || 0;
        const cseFees = parseFloat(tx.cse_fees) || 0;
        const clearingFees = parseFloat(tx.clearing_fees) || 0;
        const sec = parseFloat(tx.sec) || 0;
        const stl = parseFloat(tx.stl) || 0;
        return sum + brokerage + cdsFees + cseFees + clearingFees + sec + stl;
      }, 0);

      const calculatedCharges =
        totalBuyQuantity > 0 ? totalBuyCharges * (calculatedNetQuantity / totalBuyQuantity) : 0;

      const netValue = calculatedCostValue + calculatedCharges;
      const costPerShare = calculatedNetQuantity > 0 ? netValue / calculatedNetQuantity : 0;

      return {
        companyName: g.displayName,
        companyId: null,
        netQuantity: calculatedNetQuantity,
        avgBuyPrice: wap,
        costValue: calculatedCostValue,
        totalCharges: calculatedCharges,
        netValue,
        costPerShare
      };
    })
    .filter((h) => (h.netQuantity || 0) > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  return holdings;
};

export const buildHoldingsForPortfolioPositions = ({
  positionsData,
  allBuyTransactions,
  allSellTransactions,
  portfolioName
}) => {
  const normalize = (v) => String(v || '').toLowerCase().trim();
  const pName = normalize(portfolioName);

  // Filter buys/sells for the specific portfolio name (same rules as PortfolioDropdown).
  const buyTransactions = (allBuyTransactions || []).filter(
    (tx) => tx.portfolio && normalize(tx.portfolio) === pName
  );
  const sellTransactions = (allSellTransactions || []).filter(
    (tx) => tx.portfolio_name && normalize(tx.portfolio_name) === pName
  );

  const holdings = (positionsData || [])
    .map((position) => {
      const companyName = position.companyName || position.symbol || 'Unknown';
      const companyId = position.equityId || position.id || null;

      const companyBuyTransactions = buyTransactions.filter((tx) => {
        const txCompanyName = normalize(tx.company_name || tx.companyName || '');
        const txSymbol = normalize(tx.symbol);
        const positionCompanyName = normalize(companyName);
        const positionSymbol = normalize(position.symbol);

        return (
          txCompanyName === positionCompanyName ||
          txSymbol === positionSymbol ||
          (companyId && (tx.equity_id === companyId || tx.equityId === companyId))
        );
      });

      const companySellTransactions = sellTransactions.filter((tx) => {
        const txCompanyName = normalize(tx.company_name || tx.companyName || '');
        const txSymbol = normalize(tx.symbol);
        const positionCompanyName = normalize(companyName);
        const positionSymbol = normalize(position.symbol);

        return (
          txCompanyName === positionCompanyName ||
          txSymbol === positionSymbol ||
          (companyId && (tx.equity_id === companyId || tx.equityId === companyId))
        );
      });

      const totalBuyQuantity = companyBuyTransactions.reduce(
        (sum, tx) => sum + (parseFloat(tx.quantity) || 0),
        0
      );
      const totalBuyGrossValue = companyBuyTransactions.reduce(
        (sum, tx) => sum + (parseFloat(tx.gross_value) || 0),
        0
      );
      const totalSellQuantity = companySellTransactions.reduce(
        (sum, tx) => sum + (parseFloat(tx.quantity) || 0),
        0
      );

      const calculatedNetQuantity = Math.max(0, totalBuyQuantity - totalSellQuantity);
      const wap = totalBuyQuantity > 0 ? totalBuyGrossValue / totalBuyQuantity : 0;
      const calculatedCostValue = calculatedNetQuantity * wap;

      const totalBuyCharges = companyBuyTransactions.reduce((sum, tx) => {
        const brokerage = parseFloat(tx.brokerage) || 0;
        const cdsFees = parseFloat(tx.cds_fees) || 0;
        const cseFees = parseFloat(tx.cse_fees) || 0;
        const clearingFees = parseFloat(tx.clearing_fees) || 0;
        const sec = parseFloat(tx.sec) || 0;
        const stl = parseFloat(tx.stl) || 0;
        return sum + brokerage + cdsFees + cseFees + clearingFees + sec + stl;
      }, 0);

      const calculatedCharges =
        totalBuyQuantity > 0 ? totalBuyCharges * (calculatedNetQuantity / totalBuyQuantity) : 0;

      // Fallback to backend values if calculations produced zero values.
      const netQuantity =
        calculatedNetQuantity > 0 ? calculatedNetQuantity : parseFloat(position.quantity) || 0;
      const costValue =
        calculatedCostValue > 0 ? calculatedCostValue : parseFloat(position.costValue) || 0;
      const costPrice = wap > 0 ? wap : parseFloat(position.costPrice) || 0;
      const charges =
        calculatedCharges > 0 ? calculatedCharges : parseFloat(position.charges) || 0;

      const netValue = costValue + charges;
      const costPerShare = netQuantity > 0 ? netValue / netQuantity : 0;

      return {
        companyName,
        companyId,
        netQuantity,
        avgBuyPrice: costPrice,
        costValue,
        totalCharges: charges,
        netValue,
        costPerShare
      };
    })
    .filter((holding) => holding.netQuantity > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  return holdings;
};

