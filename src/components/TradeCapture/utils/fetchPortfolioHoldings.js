import { transactionEntryAPI } from '../../../services/api';
import { buildHoldingsFromBackendPositions } from '../../../utils/portfolioHoldingsExport';

/**
 * Build per-company holdings with running WAP from backend (same as MTM Cost Price).
 */
export async function fetchPortfolioHoldings(portfolioName, portfolios) {
  const selectedPortfolio = portfolios.find((p) => p.portfolioName === portfolioName);
  const portfolioId = selectedPortfolio?.id || selectedPortfolio?.portfolioId;
  if (!portfolioId) {
    return [];
  }

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

  return buildHoldingsFromBackendPositions(positionsData, buyTransactions, sellTransactions).map(
    (h) => ({
      ...h,
      symbol: h.companyName,
      wapGross: h.avgBuyPrice,
    })
  );
}
