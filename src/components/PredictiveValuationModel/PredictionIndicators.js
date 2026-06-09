import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Styles/PredictionIndicators.css';
import { equityAPI, tradeSummaryAPI, portfolioAPI } from '../../services/api';
import cseApi from '../../services/cseApi';
import newsApi from '../../services/newsApi';

// Modern factor card with a colored score ring.
const FactorCard = ({ value, label, signalLabel, signalColor, icon, onClick }) => {
  const percentage = Math.min(100, Math.max(0, value));
  const r = 26;
  const circ = 2 * Math.PI * r;

  const handleClick = useCallback((e) => {
    if (!onClick) return;
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  }, [onClick]);

  return (
    <div
      className={`pi-factor pi-factor--${signalColor || 'neutral'}${onClick ? ' pi-factor--clickable' : ''}`}
      onClick={handleClick}
    >
      <div className="pi-factor__top">
        <span className="pi-factor__icon">{icon}</span>
        <div className="pi-factor__heading">
          <div className="pi-factor__name">
            {label}
            {onClick && (
              <svg className="pi-factor__info" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className={`pi-signal pi-signal--${signalColor || 'neutral'}`}>{signalLabel || 'Neutral'}</span>
        </div>
      </div>
      <div className="pi-factor__ring">
        <svg viewBox="0 0 64 64">
          <circle className="pi-factor__ring-bg" cx="32" cy="32" r={r} />
          <circle
            className="pi-factor__ring-bar"
            cx="32"
            cy="32"
            r={r}
            style={{ strokeDasharray: circ, strokeDashoffset: circ * (1 - percentage / 100) }}
          />
        </svg>
        <span className="pi-factor__score">{Math.round(percentage)}</span>
      </div>
    </div>
  );
};

const signalFromColor = (color) =>
  color === 'positive' ? 'Bullish' : color === 'negative' ? 'Bearish' : 'Neutral';

const ICON = (path) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const FACTOR_ICONS = {
  fundamentals: ICON(<><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" /></>),
  sentiment: ICON(<><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-7.6-4.7L3 21l1.7-4.9A8.5 8.5 0 1 1 21 11.5z" /></>),
  economic: ICON(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>),
  sector: ICON(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  supplyDemand: ICON(<><path d="M12 3v18" /><path d="M5 8l-2 5h6l-2-5z" /><path d="M19 8l-2 5h6l-2-5z" /><path d="M5 8h14" /></>),
  global: ICON(<><circle cx="12" cy="12" r="9" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></>),
  policy: ICON(<><path d="M3 21h18" /><path d="M5 21V10M19 21V10M9 21V10M15 21V10" /><path d="M12 3 4 8h16l-8-5z" /></>),
  news: ICON(<><path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z" /><path d="M17 8h3v9a2 2 0 0 1-2 2" /><path d="M8 9h6M8 13h6" /></>),
  technical: ICON(<><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></>)
};

const PredictionIndicators = () => {
  const [equities, setEquities] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState(null);
  // Snapshot of the clicked factor — kept independent of `indicators` so the
  // modal never unmounts when indicators re-render.
  const [activeFactor, setActiveFactor] = useState(null);
  const overlayDownRef = useRef(false);

  // Extra per-company data sources surfaced when a stock is selected.
  const [liveQuote, setLiveQuote] = useState(null);
  const [liveQuoteLoading, setLiveQuoteLoading] = useState(false);
  const [liveQuoteNote, setLiveQuoteNote] = useState('');
  const [companyNews, setCompanyNews] = useState([]);
  const [companyNewsLoading, setCompanyNewsLoading] = useState(false);
  const [allHoldings, setAllHoldings] = useState([]);

  // Real-time inputs for the Global Events factor.
  const [marketIndices, setMarketIndices] = useState(null);
  const [globalNews, setGlobalNews] = useState([]);

  // Prevent body scroll when a factor modal is open
  useEffect(() => {
    document.body.style.overflow = activeFactor ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeFactor]);

  // Load equities list
  useEffect(() => {
    const loadEquities = async () => {
      try {
        const data = await equityAPI.getActiveEquities();
        setEquities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading equities:', error);
      }
    };
    loadEquities();
  }, []);

  // Calculate technical indicators
  const calculateMomentum = (prices, days = 7) => {
    if (prices.length < days + 1) return 0;
    const current = parseFloat(prices[prices.length - 1].last_trade);
    const past = parseFloat(prices[prices.length - days - 1].last_trade);
    return past > 0 ? (current - past) / past : 0;
  };

  const calculateVolumeRatio = (data, days = 30) => {
    if (data.length < days) return 1;
    const current = parseFloat(data[data.length - 1].trade_volume);
    const avg = data.slice(-days).reduce((sum, d) => sum + parseFloat(d.trade_volume || 0), 0) / days;
    return avg > 0 ? current / avg : 1;
  };

  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(parseFloat(prices[i].last_trade) - parseFloat(prices[i - 1].last_trade));
    }

    if (changes.length < period) return 50;

    const recentChanges = changes.slice(-period);
    const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
    const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  };

  const calculateMovingAverage = (prices, period) => {
    if (prices.length < period) return null;
    const recent = prices.slice(-period);
    const sum = recent.reduce((acc, p) => acc + parseFloat(p.last_trade), 0);
    return sum / period;
  };

  const calculateVolatility = (prices, period = 20) => {
    if (prices.length < period + 1) return 0;
    const recent = prices.slice(-period);
    const returns = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = parseFloat(recent[i - 1].last_trade);
      const curr = parseFloat(recent[i].last_trade);
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Return as percentage
  };

  const getSectorAverage = useCallback(async (symbol) => {
    try {
      const equity = equities.find(e => e.symbol === symbol);
      if (!equity || !equity.sector) return 0;

      const sectorEquities = equities.filter(e => e.sector === equity.sector && e.symbol !== symbol);
      if (sectorEquities.length === 0) return 0;

      const sectorReturns = [];
      for (const eq of sectorEquities.slice(0, 10)) {
        try {
          const data = await tradeSummaryAPI.getCompanyData(eq.symbol, null, null);
          if (data && data.length > 0) {
            const latest = data[data.length - 1];
            const previous = data.length > 1 ? data[data.length - 2] : latest;
            if (previous && parseFloat(previous.last_trade) > 0) {
              const returnPct = (parseFloat(latest.last_trade) - parseFloat(previous.last_trade)) / parseFloat(previous.last_trade);
              sectorReturns.push(returnPct);
            }
          }
        } catch (err) {
          // Skip if error
        }
      }

      return sectorReturns.length > 0
        ? sectorReturns.reduce((a, b) => a + b, 0) / sectorReturns.length
        : 0;
    } catch (error) {
      console.error('Error calculating sector average:', error);
      return 0;
    }
  }, [equities]);

  // Calculate all indicators (auto-calculate when data is available)
  useEffect(() => {
    const calculateIndicators = async () => {
      if (!selectedSymbol || historicalData.length < 14) {
        setIndicators(null);
        return;
      }

      setLoading(true);
      try {
        const currentPrice = parseFloat(historicalData[historicalData.length - 1].last_trade);

        const momentum7d = calculateMomentum(historicalData, 7);
        const momentum30d = calculateMomentum(historicalData, 30);
        const volumeRatio = calculateVolumeRatio(historicalData, 30);
        const rsi = calculateRSI(historicalData, 14);
        const ma7 = calculateMovingAverage(historicalData, 7);
        const ma30 = calculateMovingAverage(historicalData, 30);
        const volatility = calculateVolatility(historicalData, 20);
        const sectorTrend = await getSectorAverage(selectedSymbol);

        // Helpers + price context derived from the loaded window.
        const clamp = (n) => Math.min(100, Math.max(0, n));
        const colorOf = (s) => (s > 58 ? 'positive' : s < 42 ? 'negative' : 'neutral');
        const dirOf = (s) => (s > 55 ? 'up' : s < 45 ? 'down' : 'neutral');

        const prices = historicalData
          .map((d) => parseFloat(d.last_trade))
          .filter((n) => Number.isFinite(n));
        const periodFirst = prices[0];
        const periodHigh = Math.max(...prices);
        const periodLow = Math.min(...prices);
        const periodReturn = periodFirst > 0 ? (currentPrice - periodFirst) / periodFirst : 0;
        const rangePos = periodHigh > periodLow ? (currentPrice - periodLow) / (periodHigh - periodLow) : 0.5;

        // Factor scores (0-100 scale)
        // 1. Company Performance — price strength: position in 3M range + overall return.
        const fundamentalsScore = clamp(40 + rangePos * 40 + periodReturn * 150);
        const fundamentalsColor = colorOf(fundamentalsScore);
        const fundamentalsDirection = dirOf(fundamentalsScore);

        // 2. Market Sentiment — RSI + short-term momentum.
        const sentimentScore = clamp(rsi * 0.75 + (50 + momentum7d * 250) * 0.25);
        const sentimentColor = colorOf(sentimentScore);
        const sentimentDirection = momentum7d > 0.02 ? 'up' : momentum7d < -0.02 ? 'down' : 'neutral';

        // 3. Economic Conditions — stability proxy: lower volatility + healthy sector.
        const economicScore = clamp(60 - (volatility - 2) * 6 + sectorTrend * 400);
        const economicColor = colorOf(economicScore);
        const economicDirection = dirOf(economicScore);

        // 4. Industry & Sector — sector average performance.
        const sectorScore = 50 + (sectorTrend * 1000);
        const sectorColor = sectorTrend > 0.02 ? 'positive' : sectorTrend < -0.02 ? 'negative' : 'neutral';
        const sectorDirection = sectorTrend > 0 ? 'up' : sectorTrend < 0 ? 'down' : 'neutral';

        // 5. Supply & Demand — trading volume vs 30d average.
        const supplyDemandScore = clamp((volumeRatio - 0.5) * 66.67 + 50);
        const supplyDemandColor = volumeRatio > 1.5 ? 'positive' : volumeRatio < 0.7 ? 'negative' : 'neutral';
        const supplyDemandDirection = volumeRatio > 1.2 ? 'up' : volumeRatio < 0.8 ? 'down' : 'neutral';

        // 6. Global Events — market turbulence proxy (calmer price action = higher).
        const globalScore = clamp(85 - volatility * 12);
        const globalColor = colorOf(globalScore);
        const globalDirection = dirOf(globalScore);

        // 7. Government Policies — macro/policy proxy from medium-term trend + sector.
        const policyScore = clamp(50 + momentum30d * 200 + sectorTrend * 400);
        const policyColor = colorOf(policyScore);
        const policyDirection = dirOf(policyScore);

        // 8. Company News — inferred from abnormal volume + short-term price move.
        const newsScore = clamp(50 + momentum7d * 350 + (volumeRatio - 1) * 20);
        const newsColor = colorOf(newsScore);
        const newsDirection = dirOf(newsScore);

        const technicalScore = (rsi * 0.4 + (momentum7d * 100 + 50) * 0.3 + (currentPrice > ma7 && ma7 > ma30 ? 70 : 50) * 0.3);
        const technicalColor = technicalScore > 60 ? 'positive' : technicalScore < 40 ? 'negative' : 'neutral';
        const technicalDirection = momentum7d > 0 ? 'up' : momentum7d < 0 ? 'down' : 'neutral';

        // Composite overall signal — weighted toward the data-driven factors.
        const sectorScoreClamped = Math.min(100, Math.max(0, sectorScore));
        const technicalScoreClamped = Math.min(100, Math.max(0, technicalScore));
        const placeholderAvg =
          (fundamentalsScore + economicScore + globalScore + policyScore + newsScore) / 5;
        const compositeScore = Math.round(
          technicalScoreClamped * 0.30 +
          sentimentScore * 0.25 +
          supplyDemandScore * 0.20 +
          sectorScoreClamped * 0.15 +
          placeholderAvg * 0.10
        );
        const compositeColor =
          compositeScore >= 58 ? 'positive' : compositeScore <= 42 ? 'negative' : 'neutral';
        const compositeVerdict =
          compositeScore >= 70 ? 'Strong Bullish'
            : compositeScore >= 58 ? 'Bullish'
            : compositeScore >= 43 ? 'Neutral'
            : compositeScore >= 30 ? 'Bearish'
            : 'Strong Bearish';

        const getRSISignal = (v) => {
          if (v > 70) return { signal: 'Overbought', color: 'negative' };
          if (v < 30) return { signal: 'Oversold', color: 'positive' };
          return { signal: 'Neutral', color: 'neutral' };
        };
        const getMomentumSignal = (m) => {
          if (m > 0.05) return { signal: 'Strong Bullish', color: 'positive' };
          if (m > 0.02) return { signal: 'Bullish', color: 'positive' };
          if (m < -0.05) return { signal: 'Strong Bearish', color: 'negative' };
          if (m < -0.02) return { signal: 'Bearish', color: 'negative' };
          return { signal: 'Neutral', color: 'neutral' };
        };
        const getVolumeSignal = (ratio) => {
          if (ratio > 2) return { signal: 'High Volume', color: 'positive' };
          if (ratio > 1.5) return { signal: 'Above Average', color: 'neutral' };
          if (ratio < 0.5) return { signal: 'Low Volume', color: 'negative' };
          return { signal: 'Normal', color: 'neutral' };
        };
        const getMASignal = (price, m7, m30) => {
          if (!m7 || !m30) return { signal: 'Insufficient Data', color: 'neutral' };
          if (price > m7 && m7 > m30) return { signal: 'Bullish Trend', color: 'positive' };
          if (price < m7 && m7 < m30) return { signal: 'Bearish Trend', color: 'negative' };
          return { signal: 'Mixed', color: 'neutral' };
        };

        setIndicators({
          currentPrice,
          priceContext: { periodReturn, rangePos, periodHigh, periodLow, periodFirst },
          composite: { score: compositeScore, verdict: compositeVerdict, color: compositeColor },
          fundamentals: { score: fundamentalsScore, color: fundamentalsColor, direction: fundamentalsDirection },
          sentiment: { score: sentimentScore, color: sentimentColor, direction: sentimentDirection },
          economic: { score: economicScore, color: economicColor, direction: economicDirection },
          sector: { score: sectorScoreClamped, color: sectorColor, direction: sectorDirection },
          supplyDemand: { score: supplyDemandScore, color: supplyDemandColor, direction: supplyDemandDirection },
          global: { score: globalScore, color: globalColor, direction: globalDirection },
          policy: { score: policyScore, color: policyColor, direction: policyDirection },
          news: { score: newsScore, color: newsColor, direction: newsDirection },
          technical: { score: technicalScoreClamped, color: technicalColor, direction: technicalDirection },
          momentum: {
            '7-day': { value: momentum7d, signal: getMomentumSignal(momentum7d) },
            '30-day': { value: momentum30d, signal: getMomentumSignal(momentum30d) }
          },
          volume: { ratio: volumeRatio, signal: getVolumeSignal(volumeRatio) },
          rsi: { value: rsi, signal: getRSISignal(rsi) },
          movingAverages: { ma7, ma30, signal: getMASignal(currentPrice, ma7, ma30) },
          volatility: {
            value: volatility,
            signal: volatility > 3 ? { signal: 'High Volatility', color: 'negative' }
              : volatility > 1.5 ? { signal: 'Moderate Volatility', color: 'neutral' }
              : { signal: 'Low Volatility', color: 'positive' }
          },
          sectorTrend: {
            trend: sectorTrend,
            signal: sectorTrend > 0.02 ? { signal: 'Sector Outperforming', color: 'positive' }
              : sectorTrend < -0.02 ? { signal: 'Sector Underperforming', color: 'negative' }
              : { signal: 'Sector Neutral', color: 'neutral' }
          }
        });
      } catch (error) {
        console.error('Error calculating indicators:', error);
        setIndicators(null);
      } finally {
        setLoading(false);
      }
    };

    calculateIndicators();
  }, [selectedSymbol, historicalData, getSectorAverage]);

  // Load historical data when symbol changes
  useEffect(() => {
    const loadHistoricalData = async () => {
      if (!selectedSymbol) {
        setHistoricalData([]);
        setIndicators(null);
        return;
      }

      setLoading(true);
      try {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);

        const data = await tradeSummaryAPI.getCompanyData(
          selectedSymbol,
          startDate.toISOString().split('T')[0],
          endDate
        );

        setHistoricalData(Array.isArray(data) ? data.sort((a, b) =>
          new Date(a.trade_date) - new Date(b.trade_date)
        ) : []);
      } catch (error) {
        console.error('Error loading historical data:', error);
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, [selectedSymbol]);

  // Load the user's holdings once (account-wide) so we can show their position
  // in whichever stock they analyze.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const overview = await portfolioAPI.getPortfolioOverview();
        const holdings = overview?.data?.holdings || overview?.holdings || [];
        if (!cancelled) setAllHoldings(Array.isArray(holdings) ? holdings : []);
      } catch (e) {
        if (!cancelled) setAllHoldings([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live CSE quote (companyInfoSummery) for the selected symbol.
  useEffect(() => {
    if (!selectedSymbol) {
      setLiveQuote(null);
      setLiveQuoteNote('');
      return undefined;
    }
    let cancelled = false;
    setLiveQuoteLoading(true);
    setLiveQuoteNote('');
    (async () => {
      try {
        const res = await cseApi.companyInfo(selectedSymbol);
        if (!cancelled) {
          setLiveQuote(res?.info || null);
          setLiveQuoteNote(res?.note || '');
        }
      } catch (e) {
        if (!cancelled) {
          setLiveQuote(null);
          setLiveQuoteNote('Live CSE quote unavailable.');
        }
      } finally {
        if (!cancelled) setLiveQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSymbol]);

  // Company-specific CSE announcements (financial reports, corporate notices…).
  useEffect(() => {
    if (!selectedSymbol) {
      setCompanyNews([]);
      return undefined;
    }
    let cancelled = false;
    setCompanyNewsLoading(true);
    const equity = equities.find((e) => e.symbol === selectedSymbol);
    const companyName = equity?.name || '';
    (async () => {
      try {
        const res = await cseApi.companyAnnouncements(selectedSymbol, companyName);
        if (!cancelled) setCompanyNews(Array.isArray(res?.items) ? res.items.slice(0, 8) : []);
      } catch (e) {
        if (!cancelled) setCompanyNews([]);
      } finally {
        if (!cancelled) setCompanyNewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, equities]);

  // Real-time Global Events inputs: CSE broad-market indices (ASPI / S&P SL20)
  // plus live global business news headlines. Loaded once a stock is selected.
  useEffect(() => {
    if (!selectedSymbol) {
      setMarketIndices(null);
      setGlobalNews([]);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const [indicesRes, newsRes] = await Promise.allSettled([
        cseApi.marketIndices(),
        newsApi.searchNews({
          q: '"global economy" OR "stock market" OR "financial markets" OR inflation OR recession OR "interest rate" OR "central bank" OR "Federal Reserve" OR "oil prices" OR geopolitical OR war OR sanctions OR "supply chain" OR GDP',
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 12
        })
      ]);
      if (cancelled) return;
      setMarketIndices(
        indicesRes.status === 'fulfilled' ? indicesRes.value : null
      );
      const articles =
        newsRes.status === 'fulfilled' && Array.isArray(newsRes.value?.articles)
          ? newsRes.value.articles
          : [];
      setGlobalNews(articles);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSymbol]);

  // Lightweight headline sentiment: tally bullish vs bearish keywords.
  const newsSentiment = useMemo(() => {
    if (!globalNews || globalNews.length === 0) return { score: 0, pos: 0, neg: 0 };
    const POS = /\b(rally|rallies|gain|gains|surge|surges|soar|soars|jump|jumps|rise|rises|rebound|recovery|optimis|boost|upbeat|growth|record high|bullish|ease|eases|cooling)\b/i;
    const NEG = /\b(fall|falls|drop|drops|plunge|plunges|slump|crash|crashes|tumble|sell-off|selloff|fear|fears|recession|inflation|hike|hikes|cut jobs|layoff|war|crisis|slump|bearish|weak|weaken|default|downgrade)\b/i;
    let pos = 0;
    let neg = 0;
    globalNews.forEach((a) => {
      const text = `${a.title || ''} ${a.description || ''}`;
      if (POS.test(text)) pos += 1;
      if (NEG.test(text)) neg += 1;
    });
    const total = pos + neg;
    return { score: total > 0 ? (pos - neg) / total : 0, pos, neg };
  }, [globalNews]);

  // Real-data Global Events factor — derived from broad-market indices and
  // global news sentiment, replacing the single-stock volatility proxy.
  const globalEvents = useMemo(() => {
    const aspi = marketIndices?.aspi || null;
    const snp = marketIndices?.snp || null;
    if (!aspi && !snp && (!globalNews || globalNews.length === 0)) return null;
    const aspiPct = aspi?.percentage ?? 0;
    const snpPct = snp?.percentage ?? 0;
    const rawScore =
      50 + aspiPct * 7 + snpPct * 4 + newsSentiment.score * 10;
    const score = Math.min(100, Math.max(0, rawScore));
    const color = score > 58 ? 'positive' : score < 42 ? 'negative' : 'neutral';
    const direction = score > 55 ? 'up' : score < 45 ? 'down' : 'neutral';
    return { score, color, direction, aspi, snp, sentiment: newsSentiment };
  }, [marketIndices, globalNews, newsSentiment]);

  // Price statistics over the loaded window.
  const priceStats = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;
    const prices = historicalData
      .map((d) => parseFloat(d.last_trade))
      .filter((n) => Number.isFinite(n));
    if (prices.length === 0) return null;
    const first = prices[0];
    const last = prices[prices.length - 1];
    return {
      last,
      high: Math.max(...prices),
      low: Math.min(...prices),
      changePct: first > 0 ? ((last - first) / first) * 100 : 0,
      points: historicalData.length
    };
  }, [historicalData]);

  const selectedEquity = useMemo(
    () => equities.find((e) => e.symbol === selectedSymbol) || null,
    [equities, selectedSymbol]
  );

  // The user's current position in the selected stock (symbol or name match).
  const position = useMemo(() => {
    if (!selectedSymbol || allHoldings.length === 0) return null;
    const base = (s) => String(s || '').trim().toUpperCase().split('.')[0];
    const wantSym = base(selectedSymbol);
    const wantName = String(selectedEquity?.name || '').trim().toUpperCase();
    const matches = allHoldings.filter((h) => {
      const hSym = base(h.symbol);
      const hName = String(h.companyName || h.company_name || h.name || '')
        .trim()
        .toUpperCase();
      if (wantSym && hSym && hSym === wantSym) return true;
      if (
        wantName &&
        hName &&
        (hName === wantName || hName.includes(wantName) || wantName.includes(hName))
      )
        return true;
      return false;
    });
    if (matches.length === 0) return null;
    const quantity = matches.reduce((s, h) => s + (Number(h.quantity) || 0), 0);
    if (quantity <= 0) return null;
    const marketValue = matches.reduce((s, h) => s + (Number(h.marketValue) || 0), 0);
    const pnl = matches.reduce((s, h) => s + (Number(h.pnl) || 0), 0);
    const cost = marketValue - pnl;
    const avgCost = quantity > 0 ? cost / quantity : 0;
    return {
      quantity,
      marketValue,
      pnl,
      cost,
      avgCost,
      pnlPct: cost > 0 ? (pnl / cost) * 100 : 0
    };
  }, [selectedSymbol, allHoldings, selectedEquity]);

  // Latest trading row (today's open / previous close / day change) — fields the
  // trade-summary API already returns but the screen didn't surface before.
  const latestRow = useMemo(() => {
    const rows = Array.isArray(historicalData) ? historicalData : [];
    return rows.length ? rows[rows.length - 1] : null;
  }, [historicalData]);

  // Rich SVG chart: price line + volume bars from 3-month history.
  const priceChart = useMemo(() => {
    const rows = Array.isArray(historicalData) ? historicalData : [];
    const pts = rows
      .map((r) => ({
        date: r.trade_date,
        v: parseFloat(r.last_trade),
        vol: parseFloat(r.share_volume) || 0
      }))
      .filter((p) => Number.isFinite(p.v));
    if (pts.length < 2) return null;
    const w = 800;
    const h = 220;
    const volH = 48;
    const padX = 12;
    const padY = 16;
    const priceH = h - volH - padY;
    const vals = pts.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const maxVol = Math.max(...pts.map((p) => p.vol), 1);
    const stepX = (w - padX * 2) / (pts.length - 1);
    const barW = Math.max(2, stepX * 0.55);
    const coords = pts.map((p, i) => ({
      x: padX + i * stepX,
      y: padY + (1 - (p.v - min) / span) * (priceH - padY * 2),
      vol: p.vol,
      barW
    }));
    const line = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');
    const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${priceH} L ${coords[0].x.toFixed(1)} ${priceH} Z`;
    const sparkLine = coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${(60 - (c.y / priceH) * 50).toFixed(1)}`)
      .join(' ');
    const volBars = coords.map((c) => ({
      x: (c.x - c.barW / 2).toFixed(1),
      w: c.barW.toFixed(1),
      h: ((c.vol / maxVol) * (volH - 8)).toFixed(1),
      y: (h - ((c.vol / maxVol) * (volH - 8)) - 4).toFixed(1)
    }));
    const up = vals[vals.length - 1] >= vals[0];
    const changePct = vals[0] > 0 ? ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100 : 0;
    return {
      w,
      h,
      priceH,
      volH,
      line,
      area,
      sparkLine,
      volBars,
      min,
      max,
      up,
      changePct,
      first: pts[0],
      last: pts[pts.length - 1]
    };
  }, [historicalData]);

  const displayPrice = liveQuote?.lastTradedPrice ?? indicators?.currentPrice ?? null;
  const dayChangePct =
    liveQuote?.changePercentage ??
    (latestRow ? parseFloat(latestRow.change_percent) : null) ??
    priceStats?.changePct ??
    null;
  const dayChangeRs = liveQuote?.change ?? (latestRow ? parseFloat(latestRow.change_rs) : null);
  const dayUp = (dayChangePct ?? 0) >= 0;

  // Last actual traded price from the previous session — useful when today's
  // live last-traded price is 0 (market closed / no trade yet).
  const prevTradedPrice =
    (liveQuote?.previousClose != null && liveQuote.previousClose > 0
      ? liveQuote.previousClose
      : null) ??
    (latestRow && parseFloat(latestRow.last_trade) > 0 ? parseFloat(latestRow.last_trade) : null);
  const prevTradedDate = latestRow?.trade_date || null;

  // Real company-performance metrics derived from the full OHLC/volume rows
  // returned by the trade-summary API (fields the rest of the screen ignores).
  const companyPerf = useMemo(() => {
    const rows = Array.isArray(historicalData) ? historicalData : [];
    if (rows.length === 0) return null;
    const num = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };
    const lasts = rows.map((r) => num(r.last_trade)).filter((n) => n != null);
    if (lasts.length === 0) return null;
    const highs = rows.map((r) => num(r.high)).filter((n) => n != null && n > 0);
    const lows = rows.map((r) => num(r.low)).filter((n) => n != null && n > 0);
    const turnovers = rows.map((r) => num(r.trade_volume)).filter((n) => n != null);
    const shareVols = rows.map((r) => num(r.share_volume)).filter((n) => n != null);

    let up = 0;
    let down = 0;
    const dayChanges = [];
    for (let i = 1; i < lasts.length; i++) {
      if (lasts[i - 1] > 0) {
        const ch = (lasts[i] - lasts[i - 1]) / lasts[i - 1];
        dayChanges.push(ch);
        if (ch > 0) up++;
        else if (ch < 0) down++;
      }
    }
    const latest = rows[rows.length - 1] || {};

    return {
      trueHigh: highs.length ? Math.max(...highs) : Math.max(...lasts),
      trueLow: lows.length ? Math.min(...lows) : Math.min(...lasts),
      avgTurnover: turnovers.length ? turnovers.reduce((a, b) => a + b, 0) / turnovers.length : 0,
      totalShares: shareVols.reduce((a, b) => a + b, 0),
      up,
      down,
      winRate: up + down > 0 ? up / (up + down) : 0,
      best: dayChanges.length ? Math.max(...dayChanges) : 0,
      worst: dayChanges.length ? Math.min(...dayChanges) : 0,
      latestChangePct: num(latest.change_percent),
      latestDate: latest.trade_date || null
    };
  }, [historicalData]);

  const fmt = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  const fmtCompact = (n) =>
    Number.isFinite(n)
      ? Math.abs(n) >= 1e9 ? `${(n / 1e9).toFixed(2)}B`
        : Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(2)}M`
        : Math.abs(n) >= 1e3 ? `${(n / 1e3).toFixed(1)}K`
        : n.toLocaleString('en-US')
      : '—';

  const pct = (n) => `${(n * 100).toFixed(2)}%`;
  const signedPct = (n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`;

  const timeAgo = (iso) => {
    if (!iso) return '';
    const then = Date.parse(iso);
    if (!Number.isFinite(then)) return '';
    const mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    return `${days}d ago`;
  };

  const POS_RE = /\b(rally|rallies|gain|gains|surge|surges|soar|soars|jump|jumps|rise|rises|rebound|recovery|optimis|boost|upbeat|growth|record high|bullish|ease|eases|cooling)\b/i;
  const NEG_RE = /\b(fall|falls|drop|drops|plunge|plunges|slump|crash|crashes|tumble|sell-off|selloff|fear|fears|recession|inflation|hike|hikes|layoff|war|crisis|bearish|weak|weaken|default|downgrade)\b/i;
  const headlineTone = (a) => {
    const text = `${a?.title || ''} ${a?.description || ''}`;
    const p = POS_RE.test(text);
    const n = NEG_RE.test(text);
    if (p && !n) return 'pos';
    if (n && !p) return 'neg';
    return 'neutral';
  };

  const pc = indicators?.priceContext || {};
  const factorList = indicators
    ? [
        {
          key: 'fundamentals',
          label: 'Company Performance',
          data: indicators.fundamentals,
          icon: FACTOR_ICONS.fundamentals,
          description: 'Live trading performance for this company over the last 3 months — return, consistency (up vs down days), trading activity and intraday range, computed from the trade-summary API.',
          rows: [
            { label: '3-Month Return', value: signedPct(pc.periodReturn || 0) },
            { label: 'Latest Day Change', value: companyPerf?.latestChangePct != null ? `${companyPerf.latestChangePct >= 0 ? '+' : ''}${companyPerf.latestChangePct.toFixed(2)}%` : '—' },
            { label: 'Up vs Down Days', value: companyPerf ? `${companyPerf.up} up · ${companyPerf.down} down` : '—' },
            { label: 'Win Rate', value: companyPerf ? `${Math.round(companyPerf.winRate * 100)}%` : '—' },
            { label: 'Best Day', value: companyPerf ? signedPct(companyPerf.best) : '—' },
            { label: 'Worst Day', value: companyPerf ? signedPct(companyPerf.worst) : '—' },
            { label: 'Avg Daily Turnover', value: companyPerf ? `LKR ${fmtCompact(companyPerf.avgTurnover)}` : '—' },
            { label: 'Shares Traded (3M)', value: companyPerf ? fmtCompact(companyPerf.totalShares) : '—' },
            { label: 'Intraday High (3M)', value: companyPerf ? `LKR ${fmt(companyPerf.trueHigh)}` : '—' },
            { label: 'Intraday Low (3M)', value: companyPerf ? `LKR ${fmt(companyPerf.trueLow)}` : '—' }
          ],
          note: 'Based on live market trading data (price, OHLC & volume). Company financial statements (EPS, P/E) are not yet wired in.',
          companyData: { live: liveQuote, perf: companyPerf, equity: selectedEquity }
        },
        {
          key: 'sentiment',
          label: 'Market Sentiment',
          data: indicators.sentiment,
          icon: FACTOR_ICONS.sentiment,
          description: 'Reflects investor psychology by blending the Relative Strength Index with short-term price momentum.',
          rows: [
            { label: 'RSI (14-Day)', value: indicators.rsi.value.toFixed(2) },
            { label: '7-Day Momentum', value: signedPct(indicators.momentum['7-day'].value) }
          ]
        },
        {
          key: 'economic',
          label: 'Economic Conditions',
          data: indicators.economic,
          icon: FACTOR_ICONS.economic,
          description: 'A stability proxy: calmer price volatility and a healthy sector trend indicate a more supportive economic backdrop.',
          rows: [
            { label: '20-Day Volatility', value: pct(indicators.volatility.value / 100) },
            { label: 'Sector Avg Return', value: signedPct(indicators.sectorTrend.trend) }
          ],
          note: 'Proxy derived from market data — direct macroeconomic feeds are not yet wired in.'
        },
        {
          key: 'sector',
          label: 'Industry & Sector',
          data: indicators.sector,
          icon: FACTOR_ICONS.sector,
          description: 'Measures how the stock\'s sector peers are performing on average.',
          rows: [
            { label: 'Sector', value: selectedEquity?.sector || 'Unknown' },
            { label: 'Sector Avg Return', value: signedPct(indicators.sectorTrend.trend) }
          ]
        },
        {
          key: 'supplyDemand',
          label: 'Supply & Demand',
          data: indicators.supplyDemand,
          icon: FACTOR_ICONS.supplyDemand,
          description: 'Infers buying versus selling pressure from trading volume relative to its recent average.',
          rows: [
            { label: 'Volume Ratio', value: `${indicators.volume.ratio.toFixed(2)}x` },
            { label: 'vs 30-Day Avg', value: indicators.volume.signal.signal }
          ]
        },
        {
          key: 'global',
          label: 'Global Events',
          data: globalEvents || indicators.global,
          icon: FACTOR_ICONS.global,
          description: globalEvents
            ? 'Live read on broad-market and global forces: CSE ASPI and S&P SL20 index moves blended with sentiment from current global business headlines.'
            : 'A market-turbulence proxy — calmer, less volatile price action scores higher, signalling a steadier global backdrop.',
          rows: globalEvents
            ? [
                {
                  label: 'ASPI (All Share)',
                  value: globalEvents.aspi && Number.isFinite(globalEvents.aspi.percentage)
                    ? `${fmt(globalEvents.aspi.value)}  (${globalEvents.aspi.percentage >= 0 ? '+' : ''}${globalEvents.aspi.percentage.toFixed(2)}%)`
                    : '—'
                },
                {
                  label: 'S&P SL20',
                  value: globalEvents.snp && Number.isFinite(globalEvents.snp.percentage)
                    ? `${fmt(globalEvents.snp.value)}  (${globalEvents.snp.percentage >= 0 ? '+' : ''}${globalEvents.snp.percentage.toFixed(2)}%)`
                    : '—'
                },
                {
                  label: 'Global News Sentiment',
                  value: `${globalEvents.sentiment.pos} positive · ${globalEvents.sentiment.neg} negative`
                }
              ]
            : [
                { label: '20-Day Volatility', value: pct(indicators.volatility.value / 100) },
                { label: 'Reading', value: indicators.volatility.signal.signal }
              ],
          note: globalEvents
            ? 'Powered by live CSE ASPI / S&P SL20 indices and global business news (NewsAPI).'
            : 'Proxy derived from volatility — direct global-event feeds are not yet wired in.',
          news: globalEvents ? globalNews.slice(0, 5) : [],
          globalData: globalEvents
            ? { ...globalEvents, articles: globalNews.slice(0, 6), updatedAt: marketIndices?.lastUpdated }
            : null
        },
        {
          key: 'policy',
          label: 'Government Policies',
          data: indicators.policy,
          icon: FACTOR_ICONS.policy,
          description: 'A policy-environment proxy built from the medium-term trend and the direction of the broader sector.',
          rows: [
            { label: '30-Day Momentum', value: signedPct(indicators.momentum['30-day'].value) },
            { label: 'Sector Avg Return', value: signedPct(indicators.sectorTrend.trend) }
          ],
          note: 'Proxy derived from market data — direct policy feeds are not yet wired in.'
        },
        {
          key: 'news',
          label: 'Company News',
          data: indicators.news,
          icon: FACTOR_ICONS.news,
          description: 'Infers news impact from abnormal trading volume combined with short-term price moves (news often drives both).',
          rows: [
            { label: 'Volume Ratio', value: `${indicators.volume.ratio.toFixed(2)}x` },
            { label: '7-Day Momentum', value: signedPct(indicators.momentum['7-day'].value) }
          ],
          note: 'Proxy derived from volume & price — a direct news feed is not yet wired in.'
        },
        {
          key: 'technical',
          label: 'Technical Factors',
          data: indicators.technical,
          icon: FACTOR_ICONS.technical,
          description: 'A composite of RSI, price momentum and moving-average alignment.',
          rows: [
            { label: 'RSI (14-Day)', value: indicators.rsi.value.toFixed(2) },
            { label: '7-Day Momentum', value: signedPct(indicators.momentum['7-day'].value) },
            { label: 'MA Trend', value: indicators.movingAverages.signal.signal }
          ]
        }
      ]
    : [];

  const breakdownFactors = indicators
    ? [
        { label: 'Technical', data: indicators.technical },
        { label: 'Sentiment', data: indicators.sentiment },
        { label: 'Supply & Demand', data: indicators.supplyDemand },
        { label: 'Sector', data: indicators.sector }
      ]
    : [];

  const quickStats = indicators
    ? [
        { label: 'RSI (14D)', value: indicators.rsi.value.toFixed(1), sig: indicators.rsi.signal },
        {
          label: '7D Momentum',
          value: `${indicators.momentum['7-day'].value >= 0 ? '+' : ''}${(indicators.momentum['7-day'].value * 100).toFixed(1)}%`,
          sig: indicators.momentum['7-day'].signal
        },
        {
          label: 'Volume Ratio',
          value: `${indicators.volume.ratio.toFixed(2)}x`,
          sig: indicators.volume.signal
        },
        {
          label: 'Volatility',
          value: `${indicators.volatility.value.toFixed(1)}%`,
          sig: indicators.volatility.signal
        }
      ]
    : [];

  return (
    <div className="pi-container">
      {/* Gradient hero command bar */}
      <header className="pi-hero">
        <div className="pi-hero__bg" aria-hidden="true" />
        <div className="pi-hero__inner">
          <div className="pi-hero__brand">
            <span className="pi-hero__eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" />
              </svg>
              Predictive Analytics Engine
            </span>
            <h1 className="pi-hero__title">Prediction Indicators</h1>
            <p className="pi-hero__subtitle">
              Multi-factor technical analysis blending momentum, sentiment, supply &amp; demand and sector strength into one signal.
            </p>
          </div>
          <div className="pi-hero__control">
            <label className="pi-hero__control-lbl">Analyze a listed equity</label>
            <div className="pi-select-wrap">
              <svg className="pi-select-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <select
                className="pi-select"
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
              >
                <option value="">Select a stock…</option>
                {equities.map((eq) => (
                  <option key={eq.symbol} value={eq.symbol}>
                    {eq.symbol}{eq.name ? ` - ${eq.name}` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selectedSymbol && (
              <span className="pi-hero__chip">
                <span className="pi-hero__chip-dot" />
                {selectedSymbol}{selectedEquity?.sector ? ` · ${selectedEquity.sector}` : ''}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="pi-body">
        {!selectedSymbol ? (
          <div className="pi-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 13h2l2-5 3 9 3-13 3 9h5" />
            </svg>
            <h3>Select a stock to analyze</h3>
            <p>Pick a listed equity above to load price history and generate prediction indicators.</p>
          </div>
        ) : loading ? (
          <div className="pi-placeholder">
            <div className="pi-spinner" />
            <h3>Crunching {selectedSymbol}…</h3>
            <p>Loading price history and computing indicators.</p>
          </div>
        ) : !indicators ? (
          <div className="pi-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Not enough data</h3>
            <p>This stock doesn't have enough recent trading history (need at least 14 data points) to compute indicators.</p>
          </div>
        ) : (
          <>
            {/* Overview ticker: identity + price + verdict + quick KPIs */}
            <section className="pi-ticker">
              <div className="pi-ticker__id">
                {liveQuote?.logoUrl ? (
                  <img
                    className="pi-ticker__logo"
                    src={liveQuote.logoUrl}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span className="pi-ticker__logo pi-ticker__logo--ph">{selectedSymbol.slice(0, 2)}</span>
                )}
                <div className="pi-ticker__id-text">
                  <span className="pi-ticker__symbol">{selectedSymbol}</span>
                  <span className="pi-ticker__name">{selectedEquity?.name || 'Listed equity'}</span>
                  <span className="pi-ticker__exch">Colombo Stock Exchange</span>
                </div>
              </div>

              <div className="pi-ticker__price">
                <div className="pi-ticker__pblock">
                  <div className="pi-ticker__price-val">
                    <span className="pi-ticker__ccy">LKR</span>{fmt(displayPrice)}
                  </div>
                  {dayChangePct != null && (
                    <span className={`pi-ticker__delta pi-ticker__delta--${dayUp ? 'pos' : 'neg'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        {dayUp ? <path d="M7 14l5-5 5 5" /> : <path d="M7 10l5 5 5-5" />}
                      </svg>
                      {dayChangeRs != null ? `${dayUp ? '+' : ''}${fmt(dayChangeRs)} · ` : ''}
                      {dayUp ? '+' : ''}{dayChangePct.toFixed(2)}%
                    </span>
                  )}
                  <span className="pi-ticker__price-cap">
                    {liveQuote ? 'Live CSE price' : 'Latest close'}
                  </span>
                </div>

                <div className="pi-ticker__pblock pi-ticker__pblock--prev">
                  <div className="pi-ticker__price-val pi-ticker__price-val--prev">
                    <span className="pi-ticker__ccy">LKR</span>{fmt(prevTradedPrice)}
                  </div>
                  <span className="pi-ticker__price-cap">
                    Prev. traded{prevTradedDate ? ` · ${new Date(prevTradedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : ''}
                  </span>
                </div>
              </div>

              <div className={`pi-ticker__verdict pi-ticker__verdict--${indicators.composite.color}`}>
                <div className="pi-ticker__gauge">
                  <svg viewBox="0 0 96 96">
                    <circle className="pi-ticker__gauge-bg" cx="48" cy="48" r="40" />
                    <circle
                      className="pi-ticker__gauge-bar"
                      cx="48" cy="48" r="40"
                      style={{
                        strokeDasharray: 2 * Math.PI * 40,
                        strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.max(0, Math.min(100, indicators.composite.score)) / 100)
                      }}
                    />
                  </svg>
                  <div className="pi-ticker__gauge-num">{indicators.composite.score}</div>
                </div>
                <div className="pi-ticker__verdict-text">
                  <span className="pi-ticker__verdict-cap">Overall Signal</span>
                  <span className={`pi-signal pi-signal--${indicators.composite.color} pi-signal--lg`}>
                    {indicators.composite.verdict}
                  </span>
                </div>
              </div>

              <div className="pi-ticker__kpis">
                {quickStats.map((s, i) => (
                  <div key={i} className={`pi-ticker__kpi pi-ticker__kpi--${s.sig?.color || 'neutral'}`}>
                    <span className="pi-ticker__kpi-lbl">{s.label}</span>
                    <span className="pi-ticker__kpi-val">{s.value}</span>
                    <span className="pi-ticker__kpi-sig">{s.sig?.signal || '—'}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Main analytics grid */}
            <div className="pi-layout">
              <main className="pi-main">
                {/* Price & volume chart */}
                {priceChart && (
                  <section className="pi-card pi-card--chart">
                    <div className="pi-card__head">
                      <div>
                        <h3 className="pi-card__title">Price &amp; Volume</h3>
                        <span className="pi-card__hint">3-month trading history · {priceStats?.points || 0} sessions</span>
                      </div>
                      <span className={`pi-chart__badge pi-chart__badge--${priceChart.up ? 'pos' : 'neg'}`}>
                        {priceChart.up ? '▲' : '▼'} {priceChart.changePct >= 0 ? '+' : ''}{priceChart.changePct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="pi-chart">
                      <svg
                        viewBox={`0 0 ${priceChart.w} ${priceChart.h}`}
                        className="pi-chart__svg"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="3-month price and volume history"
                      >
                        <defs>
                          <linearGradient id="piChartFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={priceChart.up ? '#10b981' : '#ef4444'} stopOpacity="0.22" />
                            <stop offset="100%" stopColor={priceChart.up ? '#10b981' : '#ef4444'} stopOpacity="0.01" />
                          </linearGradient>
                        </defs>
                        {priceChart.volBars.map((b, i) => (
                          <rect
                            key={i}
                            x={b.x}
                            y={b.y}
                            width={b.w}
                            height={b.h}
                            className="pi-chart__vol"
                          />
                        ))}
                        <path d={priceChart.area} fill="url(#piChartFill)" stroke="none" />
                        <path
                          d={priceChart.line}
                          fill="none"
                          stroke={priceChart.up ? '#10b981' : '#ef4444'}
                          strokeWidth="2.2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="pi-chart__axis">
                        <span>3M Low · LKR {fmt(priceChart.min)}</span>
                        <span>3M High · LKR {fmt(priceChart.max)}</span>
                      </div>
                    </div>

                    {/* Range position bar */}
                    {(() => {
                      const rangePct = Math.max(0, Math.min(100, (indicators.priceContext?.rangePos || 0) * 100));
                      return (
                        <div className="pi-range">
                          <div className="pi-range__track">
                            <div className="pi-range__fill" style={{ width: `${rangePct}%` }} />
                            <div className="pi-range__dot" style={{ left: `${rangePct}%` }} />
                          </div>
                          <div className="pi-range__caps">
                            <span>Position in 3M range</span>
                            <strong>{Math.round(rangePct)}%</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </section>
                )}

                {/* Factor indicators */}
                <section className="pi-card">
                  <div className="pi-card__head">
                    <div>
                      <h3 className="pi-card__title">Factor Indicators</h3>
                      <span className="pi-card__hint">9 market-driving factors · click any for detail</span>
                    </div>
                  </div>
                  <div className="pi-factors">
                    {factorList.map((f) => (
                      <FactorCard
                        key={f.key}
                        value={f.data.score}
                        label={f.label}
                        icon={f.icon}
                        signalLabel={signalFromColor(f.data.color)}
                        signalColor={f.data.color}
                        onClick={() => setActiveFactor(f)}
                      />
                    ))}
                  </div>
                </section>

                {/* Technical indicators */}
                <section className="pi-card">
                  <div className="pi-card__head">
                    <div>
                      <h3 className="pi-card__title">Technical Indicators</h3>
                      <span className="pi-card__hint">computed from 3-month price history</span>
                    </div>
                  </div>
                  <div className="pi-tech-grid">
                    <div className="pi-metric">
                      <div className="pi-metric__label">7-Day Momentum</div>
                      <div className="pi-metric__value">{(indicators.momentum['7-day'].value * 100).toFixed(2)}%</div>
                      <span className={`pi-signal pi-signal--${indicators.momentum['7-day'].signal.color}`}>
                        {indicators.momentum['7-day'].signal.signal}
                      </span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">30-Day Momentum</div>
                      <div className="pi-metric__value">{(indicators.momentum['30-day'].value * 100).toFixed(2)}%</div>
                      <span className={`pi-signal pi-signal--${indicators.momentum['30-day'].signal.color}`}>
                        {indicators.momentum['30-day'].signal.signal}
                      </span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">Volume Ratio (30d avg)</div>
                      <div className="pi-metric__value">{indicators.volume.ratio.toFixed(2)}x</div>
                      <span className={`pi-signal pi-signal--${indicators.volume.signal.color}`}>
                        {indicators.volume.signal.signal}
                      </span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">Volatility (20d)</div>
                      <div className="pi-metric__value">{indicators.volatility.value.toFixed(2)}%</div>
                      <span className={`pi-signal pi-signal--${indicators.volatility.signal.color}`}>
                        {indicators.volatility.signal.signal}
                      </span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">7-Day MA</div>
                      <div className="pi-metric__value">
                        {indicators.movingAverages.ma7 ? `LKR ${indicators.movingAverages.ma7.toFixed(2)}` : 'N/A'}
                      </div>
                      <span className="pi-metric__hint">short-term trend</span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">30-Day MA</div>
                      <div className="pi-metric__value">
                        {indicators.movingAverages.ma30 ? `LKR ${indicators.movingAverages.ma30.toFixed(2)}` : 'N/A'}
                      </div>
                      <span className={`pi-signal pi-signal--${indicators.movingAverages.signal.color}`}>
                        {indicators.movingAverages.signal.signal}
                      </span>
                    </div>
                    <div className="pi-metric">
                      <div className="pi-metric__label">Sector Avg Return</div>
                      <div className="pi-metric__value">{(indicators.sectorTrend.trend * 100).toFixed(2)}%</div>
                      <span className={`pi-signal pi-signal--${indicators.sectorTrend.signal.color}`}>
                        {indicators.sectorTrend.signal.signal}
                      </span>
                    </div>

                    <div className="pi-metric pi-metric--wide">
                      <div className="pi-metric__head">
                        <div className="pi-metric__label">RSI (14-Day)</div>
                        <span className={`pi-signal pi-signal--${indicators.rsi.signal.color}`}>
                          {indicators.rsi.signal.signal}
                        </span>
                      </div>
                      <div className="pi-metric__value">{indicators.rsi.value.toFixed(2)}</div>
                      <div className="pi-rsi">
                        <div className="pi-rsi__bar">
                          <div className="pi-rsi__dot" style={{ left: `${Math.max(0, Math.min(100, indicators.rsi.value))}%` }} />
                        </div>
                        <div className="pi-rsi__markers">
                          <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </main>

              <aside className="pi-side">
                {/* Signal breakdown */}
                <section className={`pi-card pi-sigcard pi-sigcard--${indicators.composite.color}`}>
                  <div className="pi-card__head">
                    <div>
                      <h3 className="pi-card__title">Signal Breakdown</h3>
                      <span className="pi-card__hint">weighted composite drivers</span>
                    </div>
                  </div>
                  <p className="pi-sigcard__note">
                    Weighted blend of technical strength, market sentiment, supply &amp; demand and sector trend.
                  </p>
                  <div className="pi-breakdown">
                    {breakdownFactors.map((f, i) => (
                      <div key={i} className="pi-breakdown__row">
                        <span className="pi-breakdown__label">{f.label}</span>
                        <div className="pi-breakdown__track">
                          <div
                            className={`pi-breakdown__fill pi-breakdown__fill--${f.data.color}`}
                            style={{ width: `${Math.max(0, Math.min(100, f.data.score))}%` }}
                          />
                        </div>
                        <span className="pi-breakdown__val">{Math.round(f.data.score)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Live CSE quote */}
                {(liveQuoteLoading || liveQuote) && (
                  <section className="pi-card pi-live">
                    <div className="pi-card__head">
                      <div>
                        <h3 className="pi-card__title">Live CSE Quote</h3>
                        <span className="pi-card__hint">direct from cse.lk</span>
                      </div>
                      {liveQuote?.changePercentage != null && (
                        <span className={`pi-live__chg pi-live__chg--${liveQuote.changePercentage >= 0 ? 'pos' : 'neg'}`}>
                          {liveQuote.changePercentage >= 0 ? '+' : ''}{liveQuote.changePercentage.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {liveQuoteLoading && !liveQuote ? (
                      <div className="pi-live__loading">Loading live quote…</div>
                    ) : liveQuote ? (
                      <div className="pi-live__grid">
                        <div className="pi-live__cell"><span className="pi-live__lbl">Prev Close</span><span className="pi-live__val">LKR {fmt(liveQuote.previousClose)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Day High</span><span className="pi-live__val">LKR {fmt(liveQuote.high)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Day Low</span><span className="pi-live__val">LKR {fmt(liveQuote.low)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">52W High</span><span className="pi-live__val">LKR {fmt(liveQuote.high52)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">52W Low</span><span className="pi-live__val">LKR {fmt(liveQuote.low52)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Today Vol</span><span className="pi-live__val">{fmtCompact(liveQuote.todayShareVolume)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Turnover</span><span className="pi-live__val">LKR {fmtCompact(liveQuote.todayTurnover)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Mkt Cap</span><span className="pi-live__val">LKR {fmtCompact(liveQuote.marketCap)}</span></div>
                        <div className="pi-live__cell"><span className="pi-live__lbl">Beta</span><span className="pi-live__val">{liveQuote.beta != null ? liveQuote.beta.toFixed(2) : '—'}</span></div>
                      </div>
                    ) : (
                      <div className="pi-live__loading">{liveQuoteNote || 'No live data.'}</div>
                    )}
                  </section>
                )}

                {/* Your position */}
                {position && (
                  <section className="pi-card pi-position">
                    <div className="pi-card__head">
                      <div>
                        <h3 className="pi-card__title">Your Position</h3>
                        <span className="pi-card__hint">from your portfolios</span>
                      </div>
                      <span className={`pi-position__badge pi-position__badge--${position.pnl >= 0 ? 'pos' : 'neg'}`}>
                        {position.pnl >= 0 ? 'In profit' : 'In loss'}
                      </span>
                    </div>
                    <div className="pi-position__pnl">
                      <span className={`pi-position__pnl-val pi-position__pnl-val--${position.pnl >= 0 ? 'pos' : 'neg'}`}>
                        {position.pnl >= 0 ? '+' : ''}LKR {fmt(position.pnl)}
                      </span>
                      <span className={`pi-position__pnl-pct pi-position__pnl-pct--${position.pnl >= 0 ? 'pos' : 'neg'}`}>
                        {position.pnlPct >= 0 ? '+' : ''}{position.pnlPct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="pi-position__grid">
                      <div className="pi-position__cell"><span className="pi-position__lbl">Quantity</span><span className="pi-position__val">{position.quantity.toLocaleString()}</span></div>
                      <div className="pi-position__cell"><span className="pi-position__lbl">Avg Cost</span><span className="pi-position__val">LKR {fmt(position.avgCost)}</span></div>
                      <div className="pi-position__cell"><span className="pi-position__lbl">Cost Value</span><span className="pi-position__val">LKR {fmtCompact(position.cost)}</span></div>
                      <div className="pi-position__cell"><span className="pi-position__lbl">Market Value</span><span className="pi-position__val">LKR {fmtCompact(position.marketValue)}</span></div>
                    </div>
                  </section>
                )}

                {/* Company announcements */}
                <section className="pi-card">
                  <div className="pi-card__head">
                    <div>
                      <h3 className="pi-card__title">Announcements</h3>
                      <span className="pi-card__hint">CSE filings for {selectedSymbol}</span>
                    </div>
                  </div>
                  {companyNewsLoading ? (
                    <div className="pi-news__empty">Loading announcements…</div>
                  ) : companyNews.length === 0 ? (
                    <div className="pi-news__empty">No recent CSE announcements matched this company.</div>
                  ) : (
                    <ul className="pi-news">
                      {companyNews.map((item, i) => {
                        const dateStr = item.date
                          ? new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                          : '';
                        const Row = item.pdfUrl ? 'a' : 'div';
                        const rowProps = item.pdfUrl ? { href: item.pdfUrl, target: '_blank', rel: 'noreferrer' } : {};
                        return (
                          <li key={item.id || i} className="pi-news__item">
                            <Row className="pi-news__link" {...rowProps}>
                              <span className="pi-news__type">{item.type || item.category || 'Notice'}</span>
                              <span className="pi-news__title">{item.title || item.category || 'Announcement'}</span>
                              <span className="pi-news__meta">
                                {dateStr}
                                {item.pdfUrl && <span className="pi-news__pdf">PDF ↗</span>}
                              </span>
                            </Row>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              </aside>
            </div>
          </>
        )}
      </div>

      {/* Factor details modal */}
      {activeFactor && createPortal(
        <div
          className="pi-fmodal-overlay"
          onMouseDown={(e) => {
            overlayDownRef.current = e.target === e.currentTarget;
          }}
          onMouseUp={(e) => {
            if (overlayDownRef.current && e.target === e.currentTarget) {
              setActiveFactor(null);
            }
            overlayDownRef.current = false;
          }}
        >
          {activeFactor.key === 'global' && activeFactor.globalData ? (
            <div
              className={`pi-gmodal pi-gmodal--${activeFactor.data.color}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="pi-gmodal__close"
                type="button"
                onClick={() => setActiveFactor(null)}
                aria-label="Close"
              >
                ×
              </button>

              {/* Gradient hero */}
              <div className="pi-gmodal__hero">
                <div className="pi-gmodal__hero-bg" aria-hidden="true" />
                <div className="pi-gmodal__hero-row">
                  <div className="pi-gmodal__hero-id">
                    <span className="pi-gmodal__badge">
                      <span className="pi-gmodal__badge-dot" />LIVE
                    </span>
                    <h2 className="pi-gmodal__title">Global Events</h2>
                    <span className="pi-gmodal__sub">
                      Broad-market &amp; world forces
                      {activeFactor.globalData.updatedAt ? ` · updated ${timeAgo(activeFactor.globalData.updatedAt)}` : ''}
                    </span>
                  </div>
                  <div className="pi-gmodal__gauge">
                    <svg viewBox="0 0 96 96">
                      <circle className="pi-gmodal__gauge-bg" cx="48" cy="48" r="40" />
                      <circle
                        className="pi-gmodal__gauge-bar"
                        cx="48" cy="48" r="40"
                        style={{
                          strokeDasharray: 2 * Math.PI * 40,
                          strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.max(0, Math.min(100, activeFactor.data.score)) / 100)
                        }}
                      />
                    </svg>
                    <div className="pi-gmodal__gauge-c">
                      <span className="pi-gmodal__gauge-num">{Math.round(activeFactor.data.score)}</span>
                      <span className="pi-gmodal__gauge-out">/100</span>
                    </div>
                  </div>
                </div>
                <span className={`pi-gmodal__verdict pi-gmodal__verdict--${activeFactor.data.color}`}>
                  {signalFromColor(activeFactor.data.color)} backdrop
                </span>
              </div>

              <div className="pi-gmodal__body">
                {/* Index cards */}
                <div className="pi-gmodal__section-h">Market Indices</div>
                <div className="pi-gmodal__indices">
                  {[activeFactor.globalData.aspi, activeFactor.globalData.snp]
                    .filter(Boolean)
                    .map((idx, i) => {
                      const up = (idx.percentage ?? 0) >= 0;
                      const span = (idx.high ?? 0) - (idx.low ?? 0);
                      const posPct = span > 0
                        ? Math.max(0, Math.min(100, ((idx.value - idx.low) / span) * 100))
                        : 50;
                      return (
                        <div key={i} className={`pi-idx pi-idx--${up ? 'pos' : 'neg'}`}>
                          <div className="pi-idx__top">
                            <span className="pi-idx__name">{idx.name}</span>
                            <span className={`pi-idx__chg pi-idx__chg--${up ? 'pos' : 'neg'}`}>
                              {up ? '▲' : '▼'} {idx.percentage != null ? `${up ? '+' : ''}${idx.percentage.toFixed(2)}%` : '—'}
                            </span>
                          </div>
                          <div className="pi-idx__val">{fmt(idx.value)}</div>
                          <div className="pi-idx__delta">
                            {idx.change != null ? `${up ? '+' : ''}${fmt(idx.change)} pts today` : ''}
                          </div>
                          <div className="pi-idx__range">
                            <div className="pi-idx__range-track">
                              <div className={`pi-idx__range-fill pi-idx__range-fill--${up ? 'pos' : 'neg'}`} style={{ width: `${posPct}%` }} />
                              <div className="pi-idx__range-dot" style={{ left: `${posPct}%` }} />
                            </div>
                            <div className="pi-idx__range-ends">
                              <span>L {fmt(idx.low)}</span>
                              <span>H {fmt(idx.high)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Sentiment meter */}
                {(() => {
                  const s = activeFactor.globalData.sentiment || { pos: 0, neg: 0 };
                  const total = s.pos + s.neg;
                  const posW = total > 0 ? (s.pos / total) * 100 : 50;
                  const negW = total > 0 ? (s.neg / total) * 100 : 50;
                  const label = s.pos > s.neg ? 'Net positive' : s.neg > s.pos ? 'Net negative' : 'Mixed / neutral';
                  return (
                    <>
                      <div className="pi-gmodal__section-h">
                        Global News Sentiment
                        <span className="pi-gmodal__section-tag">{label}</span>
                      </div>
                      <div className="pi-senti">
                        <div className="pi-senti__bar">
                          <div className="pi-senti__pos" style={{ width: `${posW}%` }} />
                          <div className="pi-senti__neg" style={{ width: `${negW}%` }} />
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Live headlines feed */}
                {Array.isArray(activeFactor.globalData.articles) && activeFactor.globalData.articles.length > 0 && (
                  <>
                    <div className="pi-gmodal__section-h">Live Headlines</div>
                    <ul className="pi-feed">
                      {activeFactor.globalData.articles.map((a, i) => {
                        const tone = headlineTone(a);
                        return (
                          <li key={i} className="pi-feed__item">
                            <a href={a.url} target="_blank" rel="noreferrer" className="pi-feed__link">
                              {a.urlToImage ? (
                                <img
                                  className="pi-feed__thumb"
                                  src={a.urlToImage}
                                  alt=""
                                  loading="lazy"
                                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                                />
                              ) : (
                                <span className="pi-feed__thumb pi-feed__thumb--ph">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z" /><path d="M17 8h3v9a2 2 0 0 1-2 2" /><path d="M8 9h6M8 13h6" />
                                  </svg>
                                </span>
                              )}
                              <div className="pi-feed__text">
                                <span className="pi-feed__title">{a.title}</span>
                                <span className="pi-feed__meta">
                                  <span className={`pi-feed__tone pi-feed__tone--${tone}`} />
                                  {a.source?.name || 'News'}
                                  {a.publishedAt ? ` · ${timeAgo(a.publishedAt)}` : ''}
                                </span>
                              </div>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                <div className="pi-gmodal__foot">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Live CSE ASPI / S&amp;P SL20 indices + global business news (NewsAPI). Score = index moves blended with headline sentiment.</span>
                </div>
              </div>
            </div>
          ) : activeFactor.key === 'fundamentals' && activeFactor.companyData && activeFactor.companyData.live ? (
            (() => {
              const cd = activeFactor.companyData;
              const live = cd.live;
              const perf = cd.perf;
              const p = live.periods || {};
              const hi = p.high || {};
              const lo = p.low || {};
              const sv = p.shareVolume || {};
              const to = p.turnover || {};
              const up = (live.changePercentage ?? 0) >= 0;
              const lo52 = live.low52;
              const hi52 = live.high52;
              const span52 = (hi52 ?? 0) - (lo52 ?? 0);
              const pos52 = span52 > 0
                ? Math.max(0, Math.min(100, ((live.lastTradedPrice - lo52) / span52) * 100))
                : 50;
              const periodRows = [
                { label: 'This Week', high: hi.week, low: lo.week, vol: sv.week, turn: to.week },
                { label: 'This Month', high: hi.month, low: lo.month, vol: sv.month, turn: to.month },
                { label: 'Year-to-Date', high: hi.ytd, low: lo.ytd, vol: sv.ytd, turn: to.ytd },
                { label: '12 Months', high: hi.year, low: lo.year, vol: sv.year, turn: to.year },
                { label: 'All-Time', high: hi.all, low: lo.all, vol: null, turn: null }
              ];
              return (
            <div
              className={`pi-gmodal pi-cmodal pi-gmodal--${activeFactor.data.color}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="pi-gmodal__close"
                type="button"
                onClick={() => setActiveFactor(null)}
                aria-label="Close"
              >
                ×
              </button>

              {/* Gradient hero */}
              <div className="pi-gmodal__hero">
                <div className="pi-gmodal__hero-bg" aria-hidden="true" />
                <div className="pi-gmodal__hero-row">
                  <div className="pi-cmodal__id">
                    {live.logoUrl ? (
                      <img
                        className="pi-cmodal__logo"
                        src={live.logoUrl}
                        alt=""
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <div className="pi-gmodal__hero-id">
                      <span className="pi-gmodal__badge">
                        <span className="pi-gmodal__badge-dot" />LIVE · {live.symbol || selectedSymbol}
                      </span>
                      <h2 className="pi-gmodal__title">{live.name || cd.equity?.name || 'Company Performance'}</h2>
                      <span className="pi-gmodal__sub">
                        {cd.equity?.sector || 'Colombo Stock Exchange'}
                        {live.isin ? ` · ${live.isin}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="pi-gmodal__gauge">
                    <svg viewBox="0 0 96 96">
                      <circle className="pi-gmodal__gauge-bg" cx="48" cy="48" r="40" />
                      <circle
                        className="pi-gmodal__gauge-bar"
                        cx="48" cy="48" r="40"
                        style={{
                          strokeDasharray: 2 * Math.PI * 40,
                          strokeDashoffset: 2 * Math.PI * 40 * (1 - Math.max(0, Math.min(100, activeFactor.data.score)) / 100)
                        }}
                      />
                    </svg>
                    <div className="pi-gmodal__gauge-c">
                      <span className="pi-gmodal__gauge-num">{Math.round(activeFactor.data.score)}</span>
                      <span className="pi-gmodal__gauge-out">/100</span>
                    </div>
                  </div>
                </div>
                <div className="pi-cmodal__hero-price">
                  <span className="pi-cmodal__hero-last">LKR {fmt(live.lastTradedPrice)}</span>
                  <span className={`pi-cmodal__hero-chg pi-cmodal__hero-chg--${up ? 'pos' : 'neg'}`}>
                    {up ? '▲' : '▼'} {live.change != null ? `${up ? '+' : ''}${fmt(live.change)}` : ''}
                    {live.changePercentage != null ? ` (${up ? '+' : ''}${live.changePercentage.toFixed(2)}%)` : ''}
                  </span>
                </div>
              </div>

              <div className="pi-gmodal__body">
                {/* Live market snapshot */}
                <div className="pi-gmodal__section-h">Live Market Snapshot</div>
                <div className="pi-cstat">
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Market Cap</span><span className="pi-cstat__val">LKR {fmtCompact(live.marketCap)}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">% of Market</span><span className="pi-cstat__val">{live.marketCapPercentage != null ? `${live.marketCapPercentage.toFixed(2)}%` : '—'}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Shares Issued</span><span className="pi-cstat__val">{fmtCompact(live.quantityIssued)}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Par Value</span><span className="pi-cstat__val">{live.parValue != null ? `LKR ${fmt(live.parValue)}` : '—'}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Beta (ASI)</span><span className="pi-cstat__val">{live.beta != null ? live.beta.toFixed(2) : '—'}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Foreign Holding</span><span className="pi-cstat__val">{live.foreignPercentage != null ? `${live.foreignPercentage.toFixed(2)}%` : '—'}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Day Range</span><span className="pi-cstat__val">{fmt(live.low)} – {fmt(live.high)}</span></div>
                  <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Listed Since</span><span className="pi-cstat__val">{live.issueDate || '—'}</span></div>
                </div>

                {/* 52-week range bar */}
                {span52 > 0 && (
                  <>
                    <div className="pi-gmodal__section-h">52-Week Position</div>
                    <div className="pi-idx__range">
                      <div className="pi-idx__range-track">
                        <div className={`pi-idx__range-fill pi-idx__range-fill--${up ? 'pos' : 'neg'}`} style={{ width: `${pos52}%` }} />
                        <div className="pi-idx__range-dot" style={{ left: `${pos52}%` }} />
                      </div>
                      <div className="pi-idx__range-ends">
                        <span>52W Low {fmt(lo52)}</span>
                        <span>{Math.round(pos52)}% of range</span>
                        <span>52W High {fmt(hi52)}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Performance by period */}
                <div className="pi-gmodal__section-h">Performance by Period</div>
                <div className="pi-ptable">
                  <div className="pi-ptable__head">
                    <span>Period</span><span>High</span><span>Low</span><span>Volume</span><span>Turnover</span>
                  </div>
                  {periodRows.map((r, i) => (
                    <div key={i} className="pi-ptable__row">
                      <span className="pi-ptable__period">{r.label}</span>
                      <span>{r.high != null ? fmt(r.high) : '—'}</span>
                      <span>{r.low != null ? fmt(r.low) : '—'}</span>
                      <span>{r.vol != null ? fmtCompact(r.vol) : '—'}</span>
                      <span>{r.turn != null ? fmtCompact(r.turn) : '—'}</span>
                    </div>
                  ))}
                </div>

                {/* 3-month trading stats from trade-summary */}
                {perf && (
                  <>
                    <div className="pi-gmodal__section-h">3-Month Trading Stats</div>
                    <div className="pi-cstat">
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Win Rate</span><span className="pi-cstat__val">{Math.round(perf.winRate * 100)}%</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Up / Down Days</span><span className="pi-cstat__val">{perf.up} / {perf.down}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Best Day</span><span className="pi-cstat__val pi-cstat__val--pos">{signedPct(perf.best)}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Worst Day</span><span className="pi-cstat__val pi-cstat__val--neg">{signedPct(perf.worst)}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Avg Turnover</span><span className="pi-cstat__val">LKR {fmtCompact(perf.avgTurnover)}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Shares (3M)</span><span className="pi-cstat__val">{fmtCompact(perf.totalShares)}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Intraday High</span><span className="pi-cstat__val">{fmt(perf.trueHigh)}</span></div>
                      <div className="pi-cstat__cell"><span className="pi-cstat__lbl">Intraday Low</span><span className="pi-cstat__val">{fmt(perf.trueLow)}</span></div>
                    </div>
                  </>
                )}

                <div className="pi-gmodal__foot">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Live CSE company snapshot (companyInfoSummery) + 3-month trade-summary stats. Score reflects price strength: position in range and overall return.</span>
                </div>
              </div>
            </div>
              );
            })()
          ) : (
            <div className={`pi-fmodal pi-fmodal--${activeFactor.data.color}`} onClick={(e) => e.stopPropagation()}>
            <button
              className="pi-fmodal__close"
              type="button"
              onClick={() => setActiveFactor(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="pi-fmodal__hero">
              <span className="pi-fmodal__icon">{activeFactor.icon}</span>
              <div className="pi-fmodal__ring">
                <svg viewBox="0 0 80 80">
                  <circle className="pi-fmodal__ring-bg" cx="40" cy="40" r="33" />
                  <circle
                    className="pi-fmodal__ring-bar"
                    cx="40"
                    cy="40"
                    r="33"
                    style={{
                      strokeDasharray: 2 * Math.PI * 33,
                      strokeDashoffset:
                        2 * Math.PI * 33 * (1 - Math.max(0, Math.min(100, activeFactor.data.score)) / 100)
                    }}
                  />
                </svg>
                <span className="pi-fmodal__score">{Math.round(activeFactor.data.score)}</span>
              </div>
              <div className="pi-fmodal__heading">
                <h2>{activeFactor.label}</h2>
                <span className={`pi-signal pi-signal--${activeFactor.data.color} pi-signal--lg`}>
                  {signalFromColor(activeFactor.data.color)}
                </span>
              </div>
            </div>

            <p className="pi-fmodal__desc">{activeFactor.description}</p>

            <div className="pi-fmodal__rows">
              {activeFactor.rows.map((r, i) => (
                <div key={i} className="pi-fmodal__row">
                  <span className="pi-fmodal__row-label">{r.label}</span>
                  <span className="pi-fmodal__row-val">{r.value}</span>
                </div>
              ))}
            </div>

            {Array.isArray(activeFactor.news) && activeFactor.news.length > 0 && (
              <div className="pi-fmodal__news">
                <div className="pi-fmodal__news-head">Live headlines driving this</div>
                <ul className="pi-fmodal__news-list">
                  {activeFactor.news.map((a, i) => (
                    <li key={i} className="pi-fmodal__news-item">
                      <a href={a.url} target="_blank" rel="noreferrer" className="pi-fmodal__news-link">
                        <span className="pi-fmodal__news-title">{a.title}</span>
                        <span className="pi-fmodal__news-src">
                          {a.source?.name || 'News'}
                          {a.publishedAt ? ` · ${new Date(a.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeFactor.note && (
              <div className="pi-fmodal__note">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>{activeFactor.note}</span>
              </div>
            )}
          </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default PredictionIndicators;
