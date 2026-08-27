import React, { useState, useEffect } from 'react';
import { tradeSummaryAPI } from '../../services/api';
import './Styles/TradeCore.css';

const TradeCore = () => {
  // Game state
  const [gameMode, setGameMode] = useState('menu'); // 'menu', 'playing', 'results'
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [currentGameDate, setCurrentGameDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Game settings
  const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
  const [tradingFees, setTradingFees] = useState(true);
  const [marketEvents, setMarketEvents] = useState(true);

  // Player state
  const [playerCapital, setPlayerCapital] = useState(1000000); // Start with 1M
  const [playerPortfolio, setPlayerPortfolio] = useState([]);
  const [playerCash, setPlayerCash] = useState(1000000);
  const [gameHistory, setGameHistory] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]); // Limit orders
  const [achievements, setAchievements] = useState([]);

  // UI state
  const [selectedStock, setSelectedStock] = useState(null);
  const [sharesToBuy, setSharesToBuy] = useState('');
  const [sharesToSell, setSharesToSell] = useState('');
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [orderType, setOrderType] = useState('market'); // 'market', 'limit'
  const [limitPrice, setLimitPrice] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [selectedTab, setSelectedTab] = useState('market'); // 'market', 'portfolio', 'analytics', 'history'

  // Market events
  const [currentEvent, setCurrentEvent] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);

  // Load available dates on mount
  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Check for pending orders execution
  useEffect(() => {
    if (gameMode === 'playing' && currentGameDate && marketData.length > 0 && pendingOrders.length > 0) {
      checkPendingOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGameDate, marketData, gameMode]);

  // Check achievements
  useEffect(() => {
    if (gameMode === 'playing') {
      checkAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerPortfolio, gameHistory, gameMode]);

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      const data = await tradeSummaryAPI.getTradeSummaries();
      
      const dates = [...new Set(data.map(item => item.trade_date))].sort();
      setAvailableDates(dates);
      
      if (dates.length > 0) {
        const endDate = dates[dates.length - 1];
        const startDate = dates.length > 30 ? dates[dates.length - 31] : dates[0];
        setSelectedDateRange(`${startDate} to ${endDate}`);
      }
    } catch (err) {
      setError('Failed to load market data');
      console.error('Error loading dates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate trading fees based on real Sri Lankan trading fee structure
  const calculateFees = (amount, isBuy = true) => {
    if (!tradingFees) return 0;
    
    if (!amount || amount <= 0) return 0;
    
    const firstTierCap = 100000000; // Rs. 100 Million
    
    if (amount <= firstTierCap) {
      // Standard rates for transactions up to Rs. 100 Million
      // Total fee rate: ~1.12%
      const brokerage = Math.round(amount * 0.00640 * 100) / 100;    // 0.640%
      const cseFees = Math.round(amount * 0.00084 * 100) / 100;      // 0.084%
      const cdsFees = Math.round(amount * 0.00012 * 100) / 100;     // 0.012%
      const clearingFees = Math.round(amount * 0.00012 * 100) / 100; // 0.012%
      const sec = Math.round(amount * 0.00072 * 100) / 100;          // 0.072%
      const stl = Math.round(amount * 0.00300 * 100) / 100;            // 0.300%
      
      return brokerage + cseFees + cdsFees + clearingFees + sec + stl;
    } else {
      // Tiered calculation: standard rate for first 100M, reduced rate for excess
      const first = firstTierCap;
      const excess = amount - firstTierCap;
      
      // First tier (up to 100M) - standard rates
      const firstBrokerage = Math.round(first * 0.00640 * 100) / 100;
      const firstCSE = Math.round(first * 0.00084 * 100) / 100;
      const firstCDS = Math.round(first * 0.00012 * 100) / 100;
      const firstClearing = Math.round(first * 0.00012 * 100) / 100;
      const firstSEC = Math.round(first * 0.00072 * 100) / 100;
      const firstSTL = Math.round(first * 0.00300 * 100) / 100;
      
      // Excess tier (over 100M) - reduced rates
      const excessBrokerage = Math.round(excess * 0.00200 * 100) / 100;    // 0.200%
      const excessCSE = Math.round(excess * 0.000525 * 100) / 100;         // 0.0525%
      const excessCDS = Math.round(excess * 0.000075 * 100) / 100;        // 0.0075%
      const excessClearing = Math.round(excess * 0.000075 * 100) / 100;    // 0.0075%
      const excessSEC = Math.round(excess * 0.000450 * 100) / 100;         // 0.045%
      const excessSTL = Math.round(excess * 0.00300 * 100) / 100;          // 0.300%
      
      return (
        firstBrokerage + excessBrokerage +
        firstCSE + excessCSE +
        firstCDS + excessCDS +
        firstClearing + excessClearing +
        firstSEC + excessSEC +
        firstSTL + excessSTL
      );
    }
  };

  // Generate market events
  const generateMarketEvent = () => {
    if (!marketEvents || Math.random() > 0.3) return null; // 30% chance
    
    const events = [
      {
        type: 'bull',
        title: 'Market Rally',
        description: 'Positive economic news boosts market sentiment',
        effect: (price) => price * (1 + (Math.random() * 0.05 + 0.02)), // +2% to +7%
        icon: (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
          </svg>
        )
      },
      {
        type: 'bear',
        title: 'Market Correction',
        description: 'Uncertainty causes market sell-off',
        effect: (price) => price * (1 - (Math.random() * 0.05 + 0.02)), // -2% to -7%
        icon: (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
        )
      },
      {
        type: 'volatile',
        title: 'High Volatility',
        description: 'Market experiencing high volatility',
        effect: (price) => price * (1 + (Math.random() * 0.1 - 0.05)), // -5% to +5%
        icon: (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
          </svg>
        )
      },
      {
        type: 'sector',
        title: 'Sector News',
        description: 'Sector-specific news affects related stocks',
        effect: (price) => price * (1 + (Math.random() * 0.04 - 0.02)), // -2% to +2%
        icon: (
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.5a1 1 0 01.788 0l4 1.5a1 1 0 01.356.257l2.644 1.131a1 1 0 000-1.84l-7-3zM3.697 9.5l1.893-.809a1 1 0 00.256-.356l1.5-4a1 1 0 01.788 0l1.5 4a1 1 0 00.256.356l1.893.809L9 11.5a1 1 0 01-2 0l-.303-1.5zM9.697 15.5l-1.893.809a1 1 0 01-.256.356l-1.5 4a1 1 0 00.788 0l1.5-4a1 1 0 00-.256-.356L5.697 15.5l1.303-1.5a1 1 0 012 0l1.697 1.5zM16.303 9.5l-1.893-.809a1 1 0 00-.256-.356l-1.5-4a1 1 0 00-.788 0l-1.5 4a1 1 0 01-.256.356l-1.893.809L11 8.5a1 1 0 012 0l.303 1.5z" clipRule="evenodd"/>
          </svg>
        )
      }
    ];
    
    return events[Math.floor(Math.random() * events.length)];
  };

  const startGame = async () => {
    if (!selectedDateRange) {
      addNotification('Please select a date range', 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const [startDate, endDate] = selectedDateRange.split(' to ');
      const allData = await tradeSummaryAPI.getTradeSummaries();
      const filteredData = allData.filter(item => {
        const itemDate = item.trade_date;
        return itemDate >= startDate && itemDate <= endDate;
      });

      filteredData.sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date));
      setMarketData(filteredData);
      
      const gameDates = [...new Set(filteredData.map(item => item.trade_date))].sort();
      
      if (gameDates.length > 0) {
        setCurrentGameDate(gameDates[0]);
        setGameMode('playing');
        
        // Reset player state
        const startingCapital = difficulty === 'easy' ? 2000000 : difficulty === 'medium' ? 1000000 : 500000;
        setPlayerCapital(startingCapital);
        setPlayerCash(startingCapital);
        setPlayerPortfolio([]);
        setGameHistory([]);
        setPendingOrders([]);
        setAchievements([]);
        setEventHistory([]);
        setNotifications([]);
        
        // Generate initial event
        const event = generateMarketEvent();
        if (event) {
          setCurrentEvent(event);
          addNotification(event.title + ': ' + event.description, 'info');
        }
      }
    } catch (err) {
      setError('Failed to start game');
      console.error('Error starting game:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get current market data for the selected date
  const getCurrentMarketData = () => {
    if (!currentGameDate) return [];
    
    let data = marketData.filter(item => item.trade_date === currentGameDate);
    
    // Apply market event effects
    if (currentEvent && marketEvents) {
      data = data.map(stock => {
        const originalPrice = parseFloat(stock.last_trade);
        const adjustedPrice = currentEvent.effect(originalPrice);
        return {
          ...stock,
          last_trade: adjustedPrice.toFixed(2),
          change_rs: (adjustedPrice - parseFloat(stock.previous_close)).toFixed(2),
          change_percent: (((adjustedPrice - parseFloat(stock.previous_close)) / parseFloat(stock.previous_close)) * 100).toFixed(2)
        };
      });
    }
    
    return data;
  };

  // Get stock price for a symbol on current date
  const getStockPrice = (symbol) => {
    const stock = getCurrentMarketData().find(item => item.symbol === symbol);
    return stock ? parseFloat(stock.last_trade) : null;
  };

  // Check and execute pending limit orders
  const checkPendingOrders = () => {
    const executedOrders = [];
    const remainingOrders = [];
    
    pendingOrders.forEach(order => {
      const currentPrice = getStockPrice(order.symbol);
      if (!currentPrice) {
        remainingOrders.push(order);
        return;
      }
      
      let shouldExecute = false;
      if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
        shouldExecute = true;
      } else if (order.type === 'SELL' && currentPrice >= order.limitPrice) {
        shouldExecute = true;
      }
      
      if (shouldExecute) {
        executeLimitOrder(order, currentPrice);
        executedOrders.push(order);
        addNotification(`Limit order executed: ${order.type} ${order.shares} ${order.symbol} at Rs. ${currentPrice.toFixed(2)}`, 'success');
      } else {
        remainingOrders.push(order);
      }
    });
    
    setPendingOrders(remainingOrders);
  };

  // Execute a limit order
  const executeLimitOrder = (order, executionPrice) => {
    if (order.type === 'BUY') {
      const totalCost = order.shares * executionPrice;
      const fees = calculateFees(totalCost, true);
      const totalRequired = totalCost + fees;
      
      setPlayerCash(prevCash => {
        if (totalRequired > prevCash) {
          addNotification(`Insufficient funds to execute limit order for ${order.symbol}`, 'error');
          return prevCash;
        }
        
        setPlayerPortfolio(prevPortfolio => {
          const existingHolding = prevPortfolio.find(p => p.symbol === order.symbol);
          let updatedPortfolio;
          
          if (existingHolding) {
            const totalShares = existingHolding.shares + order.shares;
            const avgPrice = ((existingHolding.shares * existingHolding.buyPrice) + totalCost) / totalShares;
            updatedPortfolio = prevPortfolio.map(p =>
              p.symbol === order.symbol ? { ...p, shares: totalShares, buyPrice: avgPrice } : p
            );
          } else {
            updatedPortfolio = [
              ...prevPortfolio,
              {
                symbol: order.symbol,
                companyName: order.companyName,
                shares: order.shares,
                buyPrice: executionPrice,
                buyDate: currentGameDate
              }
            ];
          }
          
          return updatedPortfolio;
        });
        
        // Add to trading history
        setGameHistory(prevHistory => [
          ...prevHistory,
          {
            type: 'BUY',
            symbol: order.symbol,
            shares: order.shares,
            price: executionPrice,
            date: currentGameDate,
            total: totalCost,
            fees: fees,
            orderType: 'LIMIT'
          }
        ]);
        
        return prevCash - totalRequired;
      });
    } else if (order.type === 'SELL') {
      setPlayerPortfolio(prevPortfolio => {
        const holding = prevPortfolio.find(p => p.symbol === order.symbol);
        if (!holding || holding.shares < order.shares) {
          addNotification(`Cannot execute limit sell order: insufficient shares for ${order.symbol}`, 'error');
          return prevPortfolio;
        }
        
        const proceeds = order.shares * executionPrice;
        const fees = calculateFees(proceeds, false);
        const netProceeds = proceeds - fees;
        const profit = (executionPrice - holding.buyPrice) * order.shares;
        const profitPercent = ((executionPrice - holding.buyPrice) / holding.buyPrice) * 100;
        
        const updatedPortfolio = holding.shares === order.shares
          ? prevPortfolio.filter(p => p.symbol !== order.symbol)
          : prevPortfolio.map(p =>
              p.symbol === order.symbol ? { ...p, shares: p.shares - order.shares } : p
            );
        
        setPlayerCash(prevCash => prevCash + netProceeds);
        
        // Add to trading history
        setGameHistory(prevHistory => [
          ...prevHistory,
          {
            type: 'SELL',
            symbol: order.symbol,
            shares: order.shares,
            price: executionPrice,
            buyPrice: holding.buyPrice,
            date: currentGameDate,
            proceeds: netProceeds,
            profit: profit,
            profitPercent: profitPercent,
            fees: fees,
            orderType: 'LIMIT'
          }
        ]);
        
        return updatedPortfolio;
      });
    }
  };

  // Buy stock
  const handleBuyStock = () => {
    if (!selectedStock || !sharesToBuy || sharesToBuy <= 0) {
      addNotification('Please select a stock and enter valid number of shares', 'error');
      return;
    }

    const shares = parseInt(sharesToBuy);
    const price = parseFloat(selectedStock.last_trade);
    const totalCost = shares * price;
    const fees = calculateFees(totalCost, true);
    const totalRequired = totalCost + fees;

    if (totalRequired > playerCash) {
      addNotification(`Insufficient funds! Need Rs. ${totalRequired.toLocaleString()}, have Rs. ${playerCash.toLocaleString()}`, 'error');
      return;
    }

    if (orderType === 'limit' && limitPrice) {
      // Create limit order
      const limit = parseFloat(limitPrice);
      if (limit <= 0) {
        addNotification('Invalid limit price', 'error');
        return;
      }
      
      setPendingOrders([
        ...pendingOrders,
        {
          type: 'BUY',
          symbol: selectedStock.symbol,
          companyName: selectedStock.company_name,
          shares: shares,
          limitPrice: limit,
          date: currentGameDate
        }
      ]);
      
      addNotification(`Limit buy order placed: ${shares} ${selectedStock.symbol} at Rs. ${limit.toFixed(2)}`, 'info');
      setSelectedStock(null);
      setSharesToBuy('');
      setLimitPrice('');
      setShowStockDetails(false);
      return;
    }

    // Market order - execute immediately
    const existingHolding = playerPortfolio.find(p => p.symbol === selectedStock.symbol);
    
    let updatedPortfolio;
    if (existingHolding) {
      const totalShares = existingHolding.shares + shares;
      const avgPrice = ((existingHolding.shares * existingHolding.buyPrice) + totalCost) / totalShares;
      
      updatedPortfolio = playerPortfolio.map(p =>
        p.symbol === selectedStock.symbol
          ? { ...p, shares: totalShares, buyPrice: avgPrice }
          : p
      );
    } else {
      updatedPortfolio = [
        ...playerPortfolio,
        {
          symbol: selectedStock.symbol,
          companyName: selectedStock.company_name,
          shares: shares,
          buyPrice: price,
          buyDate: currentGameDate
        }
      ];
    }

    setPlayerPortfolio(updatedPortfolio);
    setPlayerCash(playerCash - totalRequired);
    
    setGameHistory([
      ...gameHistory,
      {
        type: 'BUY',
        symbol: selectedStock.symbol,
        shares: shares,
        price: price,
        date: currentGameDate,
        total: totalCost,
        fees: fees,
        orderType: 'MARKET'
      }
    ]);

    addNotification(`Bought ${shares} shares of ${selectedStock.symbol} for Rs. ${totalCost.toLocaleString()} (Fees: Rs. ${fees.toFixed(2)})`, 'success');

    setSelectedStock(null);
    setSharesToBuy('');
    setLimitPrice('');
    setShowStockDetails(false);
  };

  // Sell stock
  const handleSellStock = (holding) => {
    if (!sharesToSell || sharesToSell <= 0) {
      addNotification('Please enter valid number of shares to sell', 'error');
      return;
    }

    const shares = parseInt(sharesToSell);
    
    if (shares > holding.shares) {
      addNotification('You don\'t have enough shares!', 'error');
      return;
    }

    const currentPrice = getStockPrice(holding.symbol);
    if (!currentPrice) {
      addNotification('Stock price not available for this date', 'error');
      return;
    }

    if (orderType === 'limit' && limitPrice) {
      // Create limit sell order
      const limit = parseFloat(limitPrice);
      if (limit <= 0) {
        addNotification('Invalid limit price', 'error');
        return;
      }
      
      setPendingOrders([
        ...pendingOrders,
        {
          type: 'SELL',
          symbol: holding.symbol,
          companyName: holding.companyName,
          shares: shares,
          limitPrice: limit,
          date: currentGameDate
        }
      ]);
      
      addNotification(`Limit sell order placed: ${shares} ${holding.symbol} at Rs. ${limit.toFixed(2)}`, 'info');
      setSharesToSell('');
      setLimitPrice('');
      return;
    }

    // Market order - execute immediately
    const proceeds = shares * currentPrice;
    const fees = calculateFees(proceeds, false);
    const netProceeds = proceeds - fees;
    const profit = (currentPrice - holding.buyPrice) * shares;
    const profitPercent = ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100;

    const updatedPortfolio = holding.shares === shares
      ? playerPortfolio.filter(p => p.symbol !== holding.symbol)
      : playerPortfolio.map(p =>
          p.symbol === holding.symbol
            ? { ...p, shares: p.shares - shares }
            : p
        );

    setPlayerPortfolio(updatedPortfolio);
    setPlayerCash(playerCash + netProceeds);
    
    setGameHistory([
      ...gameHistory,
      {
        type: 'SELL',
        symbol: holding.symbol,
        shares: shares,
        price: currentPrice,
        buyPrice: holding.buyPrice,
        date: currentGameDate,
        proceeds: netProceeds,
        profit: profit,
        profitPercent: profitPercent,
        fees: fees,
        orderType: 'MARKET'
      }
    ]);

    const profitText = profit >= 0 ? `Profit: Rs. ${profit.toLocaleString()}` : `Loss: Rs. ${Math.abs(profit).toLocaleString()}`;
    addNotification(`Sold ${shares} ${holding.symbol} for Rs. ${netProceeds.toLocaleString()} (${profitText})`, 'success');

    setSharesToSell('');
    setLimitPrice('');
  };

  // Add notification
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Check achievements
  const checkAchievements = () => {
    const newAchievements = [];
    const pnl = calculateTotalPnL();
    const pnlPercent = (pnl / playerCapital) * 100;
    
    // First trade
    if (gameHistory.length === 1 && !achievements.find(a => a.id === 'first_trade')) {
      newAchievements.push({ id: 'first_trade', title: 'First Trade', description: 'Made your first trade!' });
    }
    
    // 10 trades
    if (gameHistory.length >= 10 && !achievements.find(a => a.id === 'trader')) {
      newAchievements.push({ id: 'trader', title: 'Active Trader', description: 'Made 10 trades!' });
    }
    
    // 5% profit
    if (pnlPercent >= 5 && !achievements.find(a => a.id === 'profit_5')) {
      newAchievements.push({ id: 'profit_5', title: '5% Profit', description: 'Achieved 5% portfolio gain!' });
    }
    
    // Diversified portfolio
    if (playerPortfolio.length >= 5 && !achievements.find(a => a.id === 'diversified')) {
      newAchievements.push({ id: 'diversified', title: 'Diversified', description: 'Hold 5 different stocks!' });
    }
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
      newAchievements.forEach(ach => {
        addNotification(`Achievement Unlocked: ${ach.title}!`, 'success');
      });
    }
  };

  // Calculate portfolio value
  const calculatePortfolioValue = () => {
    let totalValue = playerCash;
    
    playerPortfolio.forEach(holding => {
      const currentPrice = getStockPrice(holding.symbol);
      if (currentPrice) {
        totalValue += currentPrice * holding.shares;
      }
    });
    
    return totalValue;
  };

  // Calculate total profit/loss
  const calculateTotalPnL = () => {
    const currentValue = calculatePortfolioValue();
    return currentValue - playerCapital;
  };

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const totalValue = calculatePortfolioValue();
    const pnl = calculateTotalPnL();
    const pnlPercent = (pnl / playerCapital) * 100;
    
    // Sector allocation
    const sectorAllocation = {};
    playerPortfolio.forEach(holding => {
      const sector = holding.companyName?.split(' ')[0] || 'Other';
      const price = getStockPrice(holding.symbol) || 0;
      const value = price * holding.shares;
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value;
    });
    
    // Top performers
    const performers = playerPortfolio.map(holding => {
      const currentPrice = getStockPrice(holding.symbol) || 0;
      const profit = (currentPrice - holding.buyPrice) * holding.shares;
      const profitPercent = ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100;
      return {
        symbol: holding.symbol,
        profit,
        profitPercent
      };
    }).sort((a, b) => b.profit - a.profit);
    
    return {
      totalValue,
      pnl,
      pnlPercent,
      sectorAllocation,
      topPerformers: performers.slice(0, 5),
      worstPerformers: performers.slice(-5).reverse()
    };
  };

  // Advance to next day
  const advanceDay = () => {
    const gameDates = [...new Set(marketData.map(item => item.trade_date))].sort();
    const currentIndex = gameDates.indexOf(currentGameDate);
    
    if (currentIndex < gameDates.length - 1) {
      const nextDate = gameDates[currentIndex + 1];
      setCurrentGameDate(nextDate);
      
      // Generate new market event
      const event = generateMarketEvent();
      if (event) {
        setCurrentEvent(event);
        setEventHistory([...eventHistory, { ...event, date: nextDate }]);
        addNotification(event.title + ': ' + event.description, 'info');
      } else {
        setCurrentEvent(null);
      }
    } else {
      endGame();
    }
  };

  // End game
  const endGame = () => {
    setGameMode('results');
    const finalMetrics = calculatePortfolioMetrics();
    
    if (finalMetrics.pnlPercent > 10) {
      addNotification('Excellent performance! You achieved over 10% returns!', 'success');
    } else if (finalMetrics.pnlPercent > 0) {
      addNotification('Good job! You finished with a profit!', 'success');
    }
  };

  // Reset game
  const resetGame = () => {
    setGameMode('menu');
    setCurrentGameDate('');
    setMarketData([]);
    setPlayerPortfolio([]);
    setPlayerCash(1000000);
    setPlayerCapital(1000000);
    setGameHistory([]);
    setPendingOrders([]);
    setAchievements([]);
    setSelectedStock(null);
    setNotifications([]);
    setEventHistory([]);
    setCurrentEvent(null);
  };

  // Get game progress
  const getGameProgress = () => {
    if (!currentGameDate || marketData.length === 0) return 0;
    
    const gameDates = [...new Set(marketData.map(item => item.trade_date))].sort();
    const currentIndex = gameDates.indexOf(currentGameDate);
    
    return ((currentIndex + 1) / gameDates.length) * 100;
  };

  const currentMarketData = getCurrentMarketData();
  const portfolioValue = calculatePortfolioValue();
  const totalPnL = calculateTotalPnL();
  const pnlPercent = (totalPnL / playerCapital) * 100;
  const portfolioMetrics = calculatePortfolioMetrics();

  return (
    <div className="tradecore-container">
      <div className="tradecore-header">
        <div className="tradecore-header-content">
          <div className="tradecore-title-section">
            <p className="tradecore-eyebrow">Trading · Simulation</p>
            <h1>TradeCore</h1>
            <p>Historical Trading Challenge</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="tradecore-notifications">
        {notifications.map(notif => (
          <div key={notif.id} className={`tradecore-notification tradecore-notification-${notif.type}`}>
            {notif.message}
          </div>
        ))}
      </div>

      {loading && (
        <div className="tradecore-loading">
          <div className="tradecore-spinner"></div>
          <p>Loading game data...</p>
        </div>
      )}

      {error && (
        <div className="tradecore-error">
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Menu Screen */}
      {gameMode === 'menu' && (
        <div className="tradecore-menu">
          <div className="tradecore-menu-card">
            <h2>Start New Challenge</h2>
            <p>Configure your trading experience</p>
            
            <div className="tradecore-menu-form">
              <div className="tradecore-settings-section">
                <h3>Game Settings</h3>
                
                <div className="tradecore-setting-group">
                  <label>Difficulty Level:</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="tradecore-setting-select"
                  >
                    <option value="easy">Easy (Rs. 2M capital)</option>
                    <option value="medium">Medium (Rs. 1M capital)</option>
                    <option value="hard">Hard (Rs. 500K capital)</option>
                  </select>
                  <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.5rem' }}>
                    Real trading fees apply: ~1.12% (Brokerage 0.64%, CSE 0.084%, SEC 0.072%, STL 0.30%, CDS 0.012%, Clearing 0.012%)
                  </p>
                </div>

                <div className="tradecore-setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={tradingFees}
                      onChange={(e) => setTradingFees(e.target.checked)}
                    />
                    Enable Trading Fees
                  </label>
                </div>

                <div className="tradecore-setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={marketEvents}
                      onChange={(e) => setMarketEvents(e.target.checked)}
                    />
                    Enable Market Events
                  </label>
                </div>
              </div>

              <div className="tradecore-menu-form">
                <label>Select Date Range:</label>
                <select 
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="tradecore-date-select"
                >
                  <option value="">Select a date range...</option>
                  {availableDates.length > 30 && (
                    <option value={`${availableDates[0]} to ${availableDates[availableDates.length - 1]}`}>
                      All Available Dates ({availableDates.length} days)
                    </option>
                  )}
                  {availableDates.length > 7 && (
                    <option value={`${availableDates[availableDates.length - 8]} to ${availableDates[availableDates.length - 1]}`}>
                      Last 7 Days
                    </option>
                  )}
                  {availableDates.length > 14 && (
                    <option value={`${availableDates[availableDates.length - 15]} to ${availableDates[availableDates.length - 1]}`}>
                      Last 14 Days
                    </option>
                  )}
                  {availableDates.length > 30 && (
                    <option value={`${availableDates[availableDates.length - 31]} to ${availableDates[availableDates.length - 1]}`}>
                      Last 30 Days
                    </option>
                  )}
                </select>

                <div className="tradecore-game-info">
                  <div className="tradecore-info-item">
                    <span className="tradecore-info-label">Starting Capital:</span>
                    <span className="tradecore-info-value">
                      Rs. {difficulty === 'easy' ? '2,000,000' : difficulty === 'medium' ? '1,000,000' : '500,000'}
                    </span>
                  </div>
                  <div className="tradecore-info-item">
                    <span className="tradecore-info-label">Available Dates:</span>
                    <span className="tradecore-info-value">{availableDates.length} days</span>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="tradecore-start-button"
                  disabled={!selectedDateRange || loading}
                >
                  Start Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Screen */}
      {gameMode === 'playing' && (
        <div className="tradecore-game">
          {/* Market Event Banner */}
          {currentEvent && (
            <div className={`tradecore-event-banner tradecore-event-${currentEvent.type}`}>
              <div className="tradecore-event-icon">
                {currentEvent.icon}
              </div>
              <div className="tradecore-event-content">
                <strong>{currentEvent.title}</strong>: {currentEvent.description}
              </div>
            </div>
          )}

          {/* Game Stats Bar */}
          <div className="tradecore-stats-bar">
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Cash</div>
              <div className="tradecore-stat-value">Rs. {playerCash.toLocaleString()}</div>
            </div>
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Portfolio Value</div>
              <div className="tradecore-stat-value">Rs. {portfolioValue.toLocaleString()}</div>
            </div>
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Total P&L</div>
              <div className={`tradecore-stat-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                {totalPnL >= 0 ? '+' : ''}Rs. {totalPnL.toLocaleString()} ({pnlPercent.toFixed(2)}%)
              </div>
            </div>
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Current Date</div>
              <div className="tradecore-stat-value">{new Date(currentGameDate).toLocaleDateString()}</div>
            </div>
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Trades</div>
              <div className="tradecore-stat-value">{gameHistory.length}</div>
            </div>
            <div className="tradecore-stat-card">
              <div className="tradecore-stat-label">Holdings</div>
              <div className="tradecore-stat-value">{playerPortfolio.length}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="tradecore-progress">
            <div className="tradecore-progress-bar" style={{ width: `${getGameProgress()}%` }}></div>
            <span className="tradecore-progress-text">{getGameProgress().toFixed(0)}% Complete</span>
          </div>

          {/* Tabs */}
          <div className="tradecore-tabs">
            <button 
              className={selectedTab === 'market' ? 'active' : ''}
              onClick={() => setSelectedTab('market')}
            >
              Market
            </button>
            <button 
              className={selectedTab === 'portfolio' ? 'active' : ''}
              onClick={() => setSelectedTab('portfolio')}
            >
              Portfolio
            </button>
            <button 
              className={selectedTab === 'analytics' ? 'active' : ''}
              onClick={() => setSelectedTab('analytics')}
            >
              Analytics
            </button>
            <button 
              className={selectedTab === 'history' ? 'active' : ''}
              onClick={() => setSelectedTab('history')}
            >
              History
            </button>
            {pendingOrders.length > 0 && (
              <button 
                className={selectedTab === 'orders' ? 'active' : ''}
                onClick={() => setSelectedTab('orders')}
              >
                Pending Orders ({pendingOrders.length})
              </button>
            )}
            {achievements.length > 0 && (
              <button 
                className={selectedTab === 'achievements' ? 'active' : ''}
                onClick={() => setSelectedTab('achievements')}
              >
                Achievements ({achievements.length})
              </button>
            )}
          </div>

          <div className="tradecore-game-content">
            {/* Market Tab */}
            {selectedTab === 'market' && (
              <div className="tradecore-market-section">
                <h2>Market Data - {new Date(currentGameDate).toLocaleDateString()}</h2>
                
                <div className="tradecore-stock-list">
                  {currentMarketData.length === 0 ? (
                    <p>No market data available for this date</p>
                  ) : (
                    <table className="tradecore-stock-table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Company</th>
                          <th>Open</th>
                          <th>High</th>
                          <th>Low</th>
                          <th>Last Trade</th>
                          <th>Change %</th>
                          <th>Volume</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentMarketData.map((stock, index) => (
                          <tr key={index} className={selectedStock?.symbol === stock.symbol ? 'selected' : ''}>
                            <td><strong>{stock.symbol}</strong></td>
                            <td>{stock.company_name}</td>
                            <td>{parseFloat(stock.open).toFixed(2)}</td>
                            <td className="positive">{parseFloat(stock.high).toFixed(2)}</td>
                            <td className="negative">{parseFloat(stock.low).toFixed(2)}</td>
                            <td><strong>{parseFloat(stock.last_trade).toFixed(2)}</strong></td>
                            <td className={parseFloat(stock.change_percent) >= 0 ? 'positive' : 'negative'}>
                              {parseFloat(stock.change_percent) >= 0 ? '+' : ''}{parseFloat(stock.change_percent).toFixed(2)}%
                            </td>
                            <td>{parseFloat(stock.share_volume).toLocaleString()}</td>
                            <td>
                              <button 
                                onClick={() => {
                                  setSelectedStock(stock);
                                  setShowStockDetails(true);
                                }}
                                className="tradecore-action-btn"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Portfolio Tab */}
            {selectedTab === 'portfolio' && (
              <div className="tradecore-portfolio-section-full">
                <h2>Your Portfolio</h2>
                {playerPortfolio.length === 0 ? (
                  <p className="tradecore-empty-portfolio">No holdings yet. Start buying stocks!</p>
                ) : (
                  <div className="tradecore-portfolio-list">
                    {playerPortfolio.map((holding, index) => {
                      const currentPrice = getStockPrice(holding.symbol);
                      const currentValue = currentPrice ? currentPrice * holding.shares : 0;
                      const profit = currentPrice ? (currentPrice - holding.buyPrice) * holding.shares : 0;
                      const profitPercent = currentPrice ? ((currentPrice - holding.buyPrice) / holding.buyPrice) * 100 : 0;

                      return (
                        <div key={index} className="tradecore-holding-card">
                          <div className="tradecore-holding-header">
                            <div>
                              <strong>{holding.symbol}</strong>
                              <span>{holding.companyName}</span>
                            </div>
                            <div className={`tradecore-holding-pnl ${profit >= 0 ? 'positive' : 'negative'}`}>
                              {profit >= 0 ? '+' : ''}Rs. {profit.toLocaleString()} ({profitPercent.toFixed(2)}%)
                            </div>
                          </div>
                          <div className="tradecore-holding-details">
                            <div className="tradecore-holding-detail">
                              <span>Shares:</span>
                              <span>{holding.shares}</span>
                            </div>
                            <div className="tradecore-holding-detail">
                              <span>Avg Buy Price:</span>
                              <span>Rs. {holding.buyPrice.toFixed(2)}</span>
                            </div>
                            <div className="tradecore-holding-detail">
                              <span>Current Price:</span>
                              <span>{currentPrice ? `Rs. ${currentPrice.toFixed(2)}` : 'N/A'}</span>
                            </div>
                            <div className="tradecore-holding-detail">
                              <span>Current Value:</span>
                              <span>Rs. {currentValue.toLocaleString()}</span>
                            </div>
                          </div>
                          {currentPrice && (
                            <div className="tradecore-sell-section">
                              <div className="tradecore-order-type-selector">
                                <label>
                                  <input
                                    type="radio"
                                    name={`orderType-${index}`}
                                    value="market"
                                    checked={orderType === 'market'}
                                    onChange={() => setOrderType('market')}
                                  />
                                  Market
                                </label>
                                <label>
                                  <input
                                    type="radio"
                                    name={`orderType-${index}`}
                                    value="limit"
                                    checked={orderType === 'limit'}
                                    onChange={() => setOrderType('limit')}
                                  />
                                  Limit
                                </label>
                              </div>
                              {orderType === 'limit' && (
                                <input
                                  type="number"
                                  value={limitPrice}
                                  onChange={(e) => setLimitPrice(e.target.value)}
                                  placeholder="Limit price"
                                  step="0.01"
                                  min="0"
                                />
                              )}
                              <input
                                type="number"
                                value={sharesToSell}
                                onChange={(e) => setSharesToSell(e.target.value)}
                                placeholder="Shares to sell"
                                min="1"
                                max={holding.shares}
                              />
                              <button 
                                onClick={() => handleSellStock(holding)}
                                className="tradecore-sell-btn"
                              >
                                Sell
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {selectedTab === 'analytics' && (
              <div className="tradecore-analytics-section">
                <h2>Portfolio Analytics</h2>
                
                <div className="tradecore-analytics-grid">
                  <div className="tradecore-analytics-card">
                    <h3>Performance Summary</h3>
                    <div className="tradecore-metric">
                      <span>Total Return:</span>
                      <span className={portfolioMetrics.pnlPercent >= 0 ? 'positive' : 'negative'}>
                        {portfolioMetrics.pnlPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="tradecore-metric">
                      <span>Total P&L:</span>
                      <span className={portfolioMetrics.pnl >= 0 ? 'positive' : 'negative'}>
                        {portfolioMetrics.pnl >= 0 ? '+' : ''}Rs. {portfolioMetrics.pnl.toLocaleString()}
                      </span>
                    </div>
                    <div className="tradecore-metric">
                      <span>Total Trades:</span>
                      <span>{gameHistory.length}</span>
                    </div>
                    <div className="tradecore-metric">
                      <span>Win Rate:</span>
                      <span>
                        {gameHistory.filter(t => t.type === 'SELL' && t.profit > 0).length > 0
                          ? ((gameHistory.filter(t => t.type === 'SELL' && t.profit > 0).length / 
                              gameHistory.filter(t => t.type === 'SELL').length) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>

                  <div className="tradecore-analytics-card">
                    <h3>Top Performers</h3>
                    {portfolioMetrics.topPerformers.length > 0 ? (
                      <div className="tradecore-performers-list">
                        {portfolioMetrics.topPerformers.map((perf, idx) => (
                          <div key={idx} className="tradecore-performer-item">
                            <span>{perf.symbol}</span>
                            <span className="positive">
                              +Rs. {perf.profit.toLocaleString()} ({perf.profitPercent.toFixed(2)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No holdings yet</p>
                    )}
                  </div>

                  <div className="tradecore-analytics-card">
                    <h3>Sector Allocation</h3>
                    {Object.keys(portfolioMetrics.sectorAllocation).length > 0 ? (
                      <div className="tradecore-sector-list">
                        {Object.entries(portfolioMetrics.sectorAllocation)
                          .sort((a, b) => b[1] - a[1])
                          .map(([sector, value]) => (
                            <div key={sector} className="tradecore-sector-item">
                              <span>{sector}</span>
                              <span>Rs. {value.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p>No holdings yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {selectedTab === 'history' && (
              <div className="tradecore-history-section">
                <h2>Trade History</h2>
                {gameHistory.length === 0 ? (
                  <p>No trades yet</p>
                ) : (
                  <table className="tradecore-history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Symbol</th>
                        <th>Shares</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th>Fees</th>
                        <th>Order Type</th>
                        {gameHistory.some(h => h.profit !== undefined) && <th>Profit/Loss</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {gameHistory.map((trade, index) => (
                        <tr key={index}>
                          <td>{new Date(trade.date).toLocaleDateString()}</td>
                          <td className={trade.type === 'BUY' ? 'buy' : 'sell'}>{trade.type}</td>
                          <td><strong>{trade.symbol}</strong></td>
                          <td>{trade.shares}</td>
                          <td>Rs. {trade.price.toFixed(2)}</td>
                          <td>Rs. {(trade.total || trade.proceeds || 0).toLocaleString()}</td>
                          <td>Rs. {(trade.fees || 0).toFixed(2)}</td>
                          <td>{trade.orderType || 'MARKET'}</td>
                          {trade.profit !== undefined && (
                            <td className={trade.profit >= 0 ? 'positive' : 'negative'}>
                              {trade.profit >= 0 ? '+' : ''}Rs. {trade.profit.toLocaleString()} ({trade.profitPercent.toFixed(2)}%)
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Pending Orders Tab */}
            {selectedTab === 'orders' && (
              <div className="tradecore-orders-section">
                <h2>Pending Limit Orders</h2>
                {pendingOrders.length === 0 ? (
                  <p>No pending orders</p>
                ) : (
                  <div className="tradecore-orders-list">
                    {pendingOrders.map((order, index) => (
                      <div key={index} className="tradecore-order-card">
                        <div className="tradecore-order-header">
                          <strong>{order.type} {order.symbol}</strong>
                          <button 
                            onClick={() => {
                              setPendingOrders(pendingOrders.filter((_, i) => i !== index));
                              addNotification(`Cancelled ${order.type} order for ${order.symbol}`, 'info');
                            }}
                            className="tradecore-cancel-order-btn"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="tradecore-order-details">
                          <span>Shares: {order.shares}</span>
                          <span>Limit: Rs. {order.limitPrice.toFixed(2)}</span>
                          <span>Placed: {new Date(order.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Achievements Tab */}
            {selectedTab === 'achievements' && (
              <div className="tradecore-achievements-section">
                <h2>Achievements</h2>
                {achievements.length === 0 ? (
                  <p>No achievements unlocked yet</p>
                ) : (
                  <div className="tradecore-achievements-list">
                    {achievements.map((ach, index) => (
                      <div key={index} className="tradecore-achievement-card">
                        <div className="tradecore-achievement-icon">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                        <div>
                          <strong>{ach.title}</strong>
                          <p>{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Trading Panel - Always visible on right */}
            <div className="tradecore-trading-panel">
              <h2>Trading Panel</h2>
              
              {/* Order Type Selector */}
              <div className="tradecore-order-type-section">
                <label>Order Type:</label>
                <div className="tradecore-order-type-buttons">
                  <button
                    className={orderType === 'market' ? 'active' : ''}
                    onClick={() => setOrderType('market')}
                  >
                    Market
                  </button>
                  <button
                    className={orderType === 'limit' ? 'active' : ''}
                    onClick={() => setOrderType('limit')}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Buy Section */}
              <div className="tradecore-buy-section" style={{ display: showStockDetails && selectedStock ? 'block' : 'none' }}>
                {selectedStock && (
                  <>
                    <h3>Buy {selectedStock.symbol} - {selectedStock.company_name}</h3>
                    <div className="tradecore-stock-details">
                      <div className="tradecore-detail-row">
                        <span>Current Price:</span>
                        <strong>Rs. {parseFloat(selectedStock.last_trade).toFixed(2)}</strong>
                      </div>
                      <div className="tradecore-detail-row">
                        <span>Day Range:</span>
                        <span>Rs. {parseFloat(selectedStock.low).toFixed(2)} - Rs. {parseFloat(selectedStock.high).toFixed(2)}</span>
                      </div>
                      <div className="tradecore-detail-row">
                        <span>Change:</span>
                        <span className={parseFloat(selectedStock.change_percent) >= 0 ? 'positive' : 'negative'}>
                          {parseFloat(selectedStock.change_percent) >= 0 ? '+' : ''}{parseFloat(selectedStock.change_percent).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="tradecore-buy-form">
                      {orderType === 'limit' && (
                        <div>
                          <label>Limit Price:</label>
                          <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder="Enter limit price"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                      <label>Number of Shares:</label>
                      <input
                        type="number"
                        value={sharesToBuy}
                        onChange={(e) => setSharesToBuy(e.target.value)}
                        placeholder="Enter shares"
                        min="1"
                      />
                      {sharesToBuy && (
                        <div className="tradecore-cost-preview">
                          <div>Stock Cost: Rs. {(parseFloat(selectedStock.last_trade) * parseInt(sharesToBuy || 0)).toLocaleString()}</div>
                          {tradingFees && (
                            <div>Estimated Fees: Rs. {calculateFees(parseFloat(selectedStock.last_trade) * parseInt(sharesToBuy || 0), true).toFixed(2)}</div>
                          )}
                          <div><strong>Total: Rs. {((parseFloat(selectedStock.last_trade) * parseInt(sharesToBuy || 0)) + (tradingFees ? calculateFees(parseFloat(selectedStock.last_trade) * parseInt(sharesToBuy || 0), true) : 0)).toLocaleString()}</strong></div>
                        </div>
                      )}
                      <div className="tradecore-buy-actions">
                        <button onClick={handleBuyStock} className="tradecore-buy-btn">
                          {orderType === 'limit' ? 'Place Limit Order' : 'Buy Stock'}
                        </button>
                        <button onClick={() => {
                          setShowStockDetails(false);
                          setSelectedStock(null);
                        }} className="tradecore-cancel-btn">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {!selectedStock && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                    <p>Click "View" on any stock in the market table to buy</p>
                  </div>
                )}
              </div>

              {/* Game Controls */}
              <div className="tradecore-game-controls">
                <button onClick={advanceDay} className="tradecore-advance-btn">
                  Advance to Next Day
                </button>
                <button onClick={endGame} className="tradecore-end-btn">
                  End Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {gameMode === 'results' && (
        <div className="tradecore-results">
          <div className="tradecore-results-card">
            <h2>Challenge Complete!</h2>
            
            <div className="tradecore-results-summary">
              <div className="tradecore-result-stat">
                <div className="tradecore-result-label">Final Portfolio Value</div>
                <div className="tradecore-result-value">Rs. {portfolioValue.toLocaleString()}</div>
              </div>
              <div className="tradecore-result-stat">
                <div className="tradecore-result-label">Total Profit/Loss</div>
                <div className={`tradecore-result-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                  {totalPnL >= 0 ? '+' : ''}Rs. {totalPnL.toLocaleString()} ({pnlPercent.toFixed(2)}%)
                </div>
              </div>
              <div className="tradecore-result-stat">
                <div className="tradecore-result-label">Total Trades</div>
                <div className="tradecore-result-value">{gameHistory.length}</div>
              </div>
              <div className="tradecore-result-stat">
                <div className="tradecore-result-label">Remaining Cash</div>
                <div className="tradecore-result-value">Rs. {playerCash.toLocaleString()}</div>
              </div>
            </div>

            <div className="tradecore-trade-history">
              <h3>Trade History</h3>
              {gameHistory.length === 0 ? (
                <p>No trades executed</p>
              ) : (
                <table className="tradecore-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Symbol</th>
                      <th>Shares</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Fees</th>
                      {gameHistory.some(h => h.profit !== undefined) && <th>Profit/Loss</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {gameHistory.map((trade, index) => (
                      <tr key={index}>
                        <td>{new Date(trade.date).toLocaleDateString()}</td>
                        <td className={trade.type === 'BUY' ? 'buy' : 'sell'}>{trade.type}</td>
                        <td><strong>{trade.symbol}</strong></td>
                        <td>{trade.shares}</td>
                        <td>Rs. {trade.price.toFixed(2)}</td>
                        <td>Rs. {(trade.total || trade.proceeds || 0).toLocaleString()}</td>
                        <td>Rs. {(trade.fees || 0).toFixed(2)}</td>
                        {trade.profit !== undefined && (
                          <td className={trade.profit >= 0 ? 'positive' : 'negative'}>
                            {trade.profit >= 0 ? '+' : ''}Rs. {trade.profit.toLocaleString()} ({trade.profitPercent.toFixed(2)}%)
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="tradecore-results-actions">
              <button onClick={resetGame} className="tradecore-play-again-btn">
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeCore;
