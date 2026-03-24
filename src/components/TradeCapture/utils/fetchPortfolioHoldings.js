import { transactionEntryAPI } from '../../../services/api';

/**
 * Build per-company holdings with net quantity, WAP (from buys), and cost/share (incl. charges).
 * Mirrors PortfolioDropdown / Trade Capture portfolio logic.
 */
export async function fetchPortfolioHoldings(portfolioName, portfolios) {
  const selectedPortfolio = portfolios.find((p) => p.portfolioName === portfolioName);
  if (!selectedPortfolio?.id) {
    return [];
  }

  const portfolioId = selectedPortfolio.id;

  const positionsData = await transactionEntryAPI.getPortfolioPositions(portfolioId);

  let buyTransactions = [];
  try {
    const allBuyTransactions = await transactionEntryAPI.getAllBuyTransactions();
    buyTransactions = allBuyTransactions.filter(
      (tx) =>
        tx.portfolio &&
        tx.portfolio.toLowerCase().trim() === portfolioName.toLowerCase().trim()
    );
  } catch {
    /* continue */
  }

  let sellTransactions = [];
  try {
    const allSellTransactions = await transactionEntryAPI.getAllSellTransactions();
    sellTransactions = allSellTransactions.filter(
      (tx) =>
        tx.portfolio_name &&
        tx.portfolio_name.toLowerCase().trim() === portfolioName.toLowerCase().trim()
    );
  } catch {
    /* continue */
  }

  const holdings = positionsData
    .map((position) => {
      const companyName = position.companyName || position.symbol || 'Unknown';
      const companyId = position.equityId || position.id || null;
      const symbol = position.symbol || '';

      const companyBuyTransactions = buyTransactions.filter((tx) => {
        const txCompanyName = (tx.company_name || tx.companyName || '').toLowerCase().trim();
        const txSymbol = (tx.symbol || '').toLowerCase().trim();
        const positionCompanyName = companyName.toLowerCase().trim();
        const positionSymbol = (position.symbol || '').toLowerCase().trim();
        return (
          txCompanyName === positionCompanyName ||
          txSymbol === positionSymbol ||
          (companyId && (tx.equity_id === companyId || tx.equityId === companyId))
        );
      });

      const companySellTransactions = sellTransactions.filter((tx) => {
        const txCompanyName = (tx.company_name || tx.companyName || '').toLowerCase().trim();
        const txSymbol = (tx.symbol || '').toLowerCase().trim();
        const positionCompanyName = companyName.toLowerCase().trim();
        const positionSymbol = (position.symbol || '').toLowerCase().trim();
        return (
          txCompanyName === positionCompanyName ||
          txSymbol === positionSymbol ||
          (companyId && (tx.equity_id === companyId || tx.equityId === companyId))
        );
      });

      const totalBuyQuantity = companyBuyTransactions.reduce((sum, tx) => {
        return sum + (parseFloat(tx.quantity) || 0);
      }, 0);

      const totalBuyGrossValue = companyBuyTransactions.reduce((sum, tx) => {
        return sum + (parseFloat(tx.gross_value) || 0);
      }, 0);

      const totalSellQuantity = companySellTransactions.reduce((sum, tx) => {
        return sum + (parseFloat(tx.quantity) || 0);
      }, 0);

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
        symbol,
        companyId,
        netQuantity,
        wapGross: costPrice,
        avgBuyPrice: costPrice,
        costValue,
        totalCharges: charges,
        netValue,
        costPerShare,
      };
    })
    .filter((h) => h.netQuantity > 0)
    .sort((a, b) => a.companyName.localeCompare(b.companyName));

  return holdings;
}
