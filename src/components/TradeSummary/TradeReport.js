import React, { useState, useEffect } from 'react';
import './Styles/TradeReport.css';
import { tradeSummaryAPI, parsedTradeTransactionAPI, monthlyPortfolioUpdateAPI } from '../../services/api';

const TradeReport = () => {
  const [tradeData, setTradeData] = useState({
    clientInfo: {
      accountNo: '',
      clientName: '',
      brokerName: '',
      address: '',
      contact: {
        tel: '',
        fax: '',
        email: ''
      }
    },
    tradeInfo: {
      tradeDate: '',
      attention: '',
      settlementDate: ''
    },
    transactions: {
      sales: [],
      purchases: []
    },
    summary: {
      totalSales: 0,
      totalPurchases: 0,
      netSettlement: 0,
      totalSalesShares: 0,
      totalPurchaseShares: 0,
      totalBrokerage: 0,
      totalGovCess: 0,
      totalForeignBrokerage: 0,
      totalClearingFees: 0
    }
  });

  const [mainTab, setMainTab] = useState('daily-updates'); // Main tab: 'daily-updates' or 'portfolio-update'
  const [selectedView, setSelectedView] = useState('documents');
  const [selectedEquity, setSelectedEquity] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // CSV Import state for Monthly Updates
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvDragActive, setCsvDragActive] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState([]);
  const [isSavingCSV, setIsSavingCSV] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(number);
  };

  const getEquityList = () => {
    const equities = new Set();
    tradeData.transactions.sales.forEach(sale => equities.add(sale.equity));
    tradeData.transactions.purchases.forEach(purchase => equities.add(purchase.equity));
    return Array.from(equities);
  };

  const getFilteredTransactions = () => {
    if (selectedEquity === 'all') {
      return {
        sales: tradeData.transactions.sales,
        purchases: tradeData.transactions.purchases
      };
    }
    
    return {
      sales: tradeData.transactions.sales.filter(sale => sale.equity === selectedEquity),
      purchases: tradeData.transactions.purchases.filter(purchase => purchase.equity === selectedEquity)
    };
  };

  const getFilteredSummary = () => {
    const filteredData = getFilteredTransactions();
    
    const totalSales = filteredData.sales.reduce((sum, sale) => sum + sale.netAmount, 0);
    const totalPurchases = filteredData.purchases.reduce((sum, purchase) => sum + purchase.netAmount, 0);
    const totalSalesShares = filteredData.sales.reduce((sum, sale) => sum + sale.shares, 0);
    const totalPurchaseShares = filteredData.purchases.reduce((sum, purchase) => sum + purchase.shares, 0);
    const totalBrokerage = filteredData.sales.reduce((sum, sale) => sum + sale.brokerage, 0) + 
                           filteredData.purchases.reduce((sum, purchase) => sum + purchase.brokerage, 0);
    const totalGovCess = filteredData.sales.reduce((sum, sale) => sum + sale.govCess, 0) + 
                         filteredData.purchases.reduce((sum, purchase) => sum + purchase.govCess, 0);
    
    return {
      totalSales,
      totalPurchases,
      netSettlement: totalSales - totalPurchases,
      totalSalesShares,
      totalPurchaseShares,
      totalBrokerage,
      totalGovCess
    };
  };

  const renderTransactionRow = (transaction, index) => (
    <tr key={index}>
      <td>{transaction.contractNo}</td>
      <td>{transaction.equity}</td>
      <td>{formatNumber(transaction.shares)}</td>
      <td>{formatNumber(transaction.price)}</td>
      <td>{formatCurrency(transaction.grossAmount)}</td>
      <td>{formatCurrency(transaction.brokerage)}</td>
      <td>{formatCurrency(transaction.govCess)}</td>
      <td>{formatCurrency(transaction.netAmount)}</td>
      <td>{transaction.settlementDate}</td>
      <td>{formatCurrency(transaction.foreignBrokerage)}</td>
      <td>{formatCurrency(transaction.clearingFees)}</td>
    </tr>
  );

  const renderParsedTransactionRow = (transaction, index) => {
    // Calculate gross amount (quantity * price)
    const grossAmount = (parseFloat(transaction.quantity) || 0) * (parseFloat(transaction.price) || 0);
    
    // Calculate total fees
    const totalFees = (parseFloat(transaction.brokerage) || 0) +
                     (parseFloat(transaction.governmentCess) || 0) +
                     (parseFloat(transaction.clearingFees) || 0) +
                     (parseFloat(transaction.cseFees) || 0) +
                     (parseFloat(transaction.cdsFees) || 0) +
                     (parseFloat(transaction.secCess) || 0) +
                     (parseFloat(transaction.foreignBrokerage) || 0);
    
    // Calculate net amount
    const netAmount = grossAmount - totalFees;
    
    // Use selling contract for sales, buying contract for purchases
    const contractNo = transaction.buySell === 'S' || transaction.buySell === 's' 
      ? transaction.sellingContractNo 
      : transaction.buyingContractNo;
    
    return (
      <tr key={index}>
        <td>{contractNo || 'N/A'}</td>
        <td>{transaction.companyId || transaction.companySymbol || 'N/A'}</td>
        <td>{formatNumber(transaction.quantity)}</td>
        <td>{formatNumber(transaction.price)}</td>
        <td>{formatCurrency(grossAmount)}</td>
        <td>{formatCurrency(transaction.brokerage)}</td>
        <td>{formatCurrency(transaction.governmentCess)}</td>
        <td>{formatCurrency(netAmount)}</td>
        <td>{transaction.settlementDate || 'N/A'}</td>
        <td>{formatCurrency(transaction.foreignBrokerage)}</td>
        <td>{formatCurrency(transaction.clearingFees)}</td>
      </tr>
    );
  };

  const renderOverview = () => {
    const filteredSummary = getFilteredSummary();
    const filteredData = getFilteredTransactions();
    const hasData = filteredData.sales.length > 0 || filteredData.purchases.length > 0;
    
    if (!hasData) {
      return (
        <div className="tr-overview-section">
          <div className="tr-no-data-message">
            <div className="tr-no-data-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>No Trade Data Available</h3>
            <p>Upload and parse a trade report file to view transaction overview and statistics.</p>
            <p className="tr-hint">Go to the <strong>Documents</strong> tab to upload a trade report file.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="tr-overview-section">
        {selectedEquity !== 'all' && (
          <div className="tr-equity-header">
            <h2>Summary for {selectedEquity}</h2>
          </div>
        )}
        
        <div className="tr-summary-cards">
          <div className="tr-summary-card">
            <h3>Total Sales</h3>
                            <div className="tr-amount">{formatCurrency(filteredSummary.totalSales)}</div>
            <div className="tr-sub-info">{formatNumber(filteredSummary.totalSalesShares)} shares</div>
          </div>
          <div className="tr-summary-card">
            <h3>Total Purchases</h3>
                            <div className="tr-amount">{formatCurrency(filteredSummary.totalPurchases)}</div>
            <div className="tr-sub-info">{formatNumber(filteredSummary.totalPurchaseShares)} shares</div>
          </div>
          <div className="tr-summary-card">
            <h3>Net Settlement</h3>
                            <div className="tr-amount">{formatCurrency(filteredSummary.netSettlement)}</div>
            <div className="tr-sub-info">Net Position</div>
          </div>
        </div>
        
        <div className="tr-detailed-stats">
          <h3>Transaction Summary</h3>
          <div className="tr-stats-grid">
            <div className="tr-stat-item">
              <span className="tr-label">Total Sales Transactions:</span>
              <span className="tr-value">{filteredData.sales.length}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Purchase Transactions:</span>
              <span className="tr-value">{filteredData.purchases.length}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Brokerage:</span>
                              <span className="tr-value">{formatCurrency(filteredSummary.totalBrokerage)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total GOV CESS:</span>
                              <span className="tr-value">{formatCurrency(filteredSummary.totalGovCess)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Foreign Brokerage:</span>
                              <span className="tr-value">{formatCurrency(tradeData.summary.totalForeignBrokerage)}</span>
            </div>
            <div className="tr-stat-item">
              <span className="tr-label">Total Clearing Fees:</span>
                              <span className="tr-value">{formatCurrency(tradeData.summary.totalClearingFees)}</span>
            </div>
          </div>
        </div>
        
        <div className="tr-quick-stats">
          <div className="tr-stat-item">
            <span className="tr-label">Trade Date:</span>
            <span className="tr-value">{tradeData.tradeInfo.tradeDate || 'N/A'}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Settlement Date:</span>
            <span className="tr-value">{tradeData.tradeInfo.settlementDate || 'N/A'}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Client Account:</span>
            <span className="tr-value">{tradeData.clientInfo.accountNo || 'N/A'}</span>
          </div>
          <div className="tr-stat-item">
            <span className="tr-label">Client Name:</span>
            <span className="tr-value">{tradeData.clientInfo.clientName || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    // Filter parsed data for sell transactions (S)
    const sellTransactions = parsedData.filter(t => 
      (t.buySell === 'S' || t.buySell === 's') &&
      (selectedEquity === 'all' || t.companyId === selectedEquity || t.companySymbol === selectedEquity)
    );
    
    // Fallback to old data if no parsed data
    const filteredData = getFilteredTransactions();
    const hasParsedData = parsedData.length > 0;
    const transactionsToShow = hasParsedData ? sellTransactions : filteredData.sales;
    
    if (transactionsToShow.length === 0) {
      return (
        <div className="tr-transactions-section">
          <h3>Sales Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
          <div className="tr-no-data-message">
            <h3>No Sales Transactions Available</h3>
            <p>{hasParsedData 
              ? 'No sell transactions found in the parsed data.' 
              : 'Upload and parse a trade report file to view sales transactions.'}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="tr-transactions-section">
        <h3>Sales Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
        <div className="tr-table-container">
          <table className="tr-transactions-table">
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Equity</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Gross Amount</th>
                <th>Brokerage</th>
                <th>GOV CESS</th>
                <th>Net Amount</th>
                <th>Settlement</th>
                <th>Foreign Brokerage</th>
                <th>Clearing Fees</th>
              </tr>
            </thead>
            <tbody>
              {hasParsedData 
                ? transactionsToShow.map((transaction, index) => 
                    renderParsedTransactionRow(transaction, index)
                  )
                : transactionsToShow.map((sale, index) => 
                renderTransactionRow(sale, index)
                  )
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPurchases = () => {
    // Filter parsed data for buy transactions (B)
    const buyTransactions = parsedData.filter(t => 
      (t.buySell === 'B' || t.buySell === 'b') &&
      (selectedEquity === 'all' || t.companyId === selectedEquity || t.companySymbol === selectedEquity)
    );
    
    // Fallback to old data if no parsed data
    const filteredData = getFilteredTransactions();
    const hasParsedData = parsedData.length > 0;
    const transactionsToShow = hasParsedData ? buyTransactions : filteredData.purchases;
    
    if (transactionsToShow.length === 0) {
      return (
        <div className="tr-transactions-section">
          <h3>Purchase Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
          <div className="tr-no-data-message">
            <h3>No Purchase Transactions Available</h3>
            <p>{hasParsedData 
              ? 'No buy transactions found in the parsed data.' 
              : 'Upload and parse a trade report file to view purchase transactions.'}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="tr-transactions-section">
        <h3>Purchase Transactions {selectedEquity !== 'all' && `- ${selectedEquity}`}</h3>
        <div className="tr-table-container">
          <table className="tr-transactions-table">
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Equity</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Gross Amount</th>
                <th>Brokerage</th>
                <th>GOV CESS</th>
                <th>Net Amount</th>
                <th>Settlement</th>
                <th>Foreign Brokerage</th>
                <th>Clearing Fees</th>
              </tr>
            </thead>
            <tbody>
              {hasParsedData 
                ? transactionsToShow.map((transaction, index) => 
                    renderParsedTransactionRow(transaction, index)
                  )
                : transactionsToShow.map((purchase, index) => 
                renderTransactionRow(purchase, index)
                  )
              }
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClientInfo = () => (
    <div className="tr-client-info-section">
      <div className="tr-client-header">
        <h2>TRADE CONFIRMATION</h2>
      </div>
      
      <div className="tr-client-details">
        <div className="tr-client-left">
          <div className="tr-info-group">
            <label>Client A/C No:</label>
            <span>{tradeData.clientInfo.accountNo}</span>
          </div>
          <div className="tr-info-group">
            <label>Client Name:</label>
            <span>{tradeData.clientInfo.clientName}</span>
          </div>
          <div className="tr-info-group">
            <label>Broker:</label>
            <span>{tradeData.clientInfo.brokerName}</span>
          </div>
          <div className="tr-info-group">
            <label>Address:</label>
            <span>{tradeData.clientInfo.address}</span>
          </div>
        </div>
        
        <div className="tr-client-right">
          <div className="tr-info-group">
            <label>Trade Date:</label>
            <span>{tradeData.tradeInfo.tradeDate}</span>
          </div>
          <div className="tr-info-group">
            <label>Attention:</label>
            <span>{tradeData.tradeInfo.attention}</span>
          </div>
          <div className="tr-info-group">
            <label>Settlement Date:</label>
            <span>{tradeData.tradeInfo.settlementDate}</span>
          </div>
          <div className="tr-info-group">
            <label>Tel:</label>
            <span>{tradeData.clientInfo.contact.tel}</span>
          </div>
          <div className="tr-info-group">
            <label>Fax:</label>
            <span>{tradeData.clientInfo.contact.fax}</span>
          </div>
          <div className="tr-info-group">
            <label>Email:</label>
            <span>{tradeData.clientInfo.contact.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const readTextFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const parseTransactionData = (textContent) => {
    const lines = textContent.split('\n').filter(line => line.trim());
    const transactions = [];

    lines.forEach((line, index) => {
      // Skip header lines and lines that are too short (minimum expected length ~240+)
      if (line.length < 240) return;
      
      // Skip lines that look like headers or metadata
      if (line.includes('COLUMN NAME') || line.includes('EXECUTIONS') || line.includes('COUNT')) return;

      try {
        // Parse based on exact column structure provided
        const transaction = {
          id: index + 1,
          // Position 0-9: trade_date CHAR(10)
          tradeDate: line.substring(0, 10).trim(),
          // Position 11-18: trade_time CHAR(8)
          tradeTime: line.substring(11, 19).trim(),
          // Position 20: buy_sell CHAR(1)
          buySell: line.substring(20, 21).trim(),
          // Position 22-37: execution_id CHAR(16)
          executionId: line.substring(22, 38).trim(),
          // Position 38-41: company_id CHAR(4)
          companyId: line.substring(38, 42).trim(),
          // Position 42: main_type CHAR(1)
          mainType: line.substring(42, 43).trim(),
          // Position 43-46: sub_type CHAR(4)
          subType: line.substring(43, 47).trim(),
          // Position 47-57: quantity NUM(11)
          quantity: parseInt(line.substring(47, 58).trim()) || 0,
          // Position 58-67: price NUM(9,2) - 10 chars total
          price: parseFloat(line.substring(58, 68).trim()) || 0,
          // Position 69: lot_type CHAR(1)
          lotType: line.substring(69, 70).trim(),
          // Position 72-74: broker_id_buy CHAR(3)
          buyingBroker: line.substring(72, 75).trim(),
          // Position 76-78: broker_id_sell CHAR(3)
          sellingBroker: line.substring(76, 79).trim(),
          // Position 80-87: buying_contract_no NUM(8)
          buyingContractNo: line.substring(80, 88).trim(),
          // Position 89-96: selling_contract_no NUM(8)
          sellingContractNo: line.substring(89, 97).trim(),
          // Position 98-107: client_prefix NUM(10)
          clientPrefix: line.substring(98, 108).trim(),
          // Position 108-109: client_suffix CHAR(2)
          clientSuffix: line.substring(108, 110).trim(),
          // Position 110-111: joint_ac_no NUM(2)
          jointAcNo: line.substring(110, 112).trim(),
          // Position 113-115: participant_id CHAR(3)
          participantId: line.substring(113, 116).trim(),
          // Position 117: foreign_flag NUM(1)
          foreignFlag: line.substring(117, 118).trim(),
          // Position 119-130: brokerage NUM(11,2) - 12 chars
          brokerage: parseFloat(line.substring(119, 131).trim()) || 0,
          // Position 131-142: cds_fees NUM(11,2) - 12 chars
          cdsFees: parseFloat(line.substring(131, 143).trim()) || 0,
          // Position 143-154: cse_fees NUM(11,2) - 12 chars
          cseFees: parseFloat(line.substring(143, 155).trim()) || 0,
          // Position 155-166: clearing_fees NUM(11,2) - 12 chars
          clearingFees: parseFloat(line.substring(155, 167).trim()) || 0,
          // Position 167-178: sec_cess NUM(11,2) - 12 chars
          secCess: parseFloat(line.substring(167, 179).trim()) || 0,
          // Position 179-190: brokerage_foreign NUM(11,2) - 12 chars
          foreignBrokerage: parseFloat(line.substring(179, 191).trim()) || 0,
          // Position 192-211: order_id CHAR(20)
          orderId: line.substring(192, 212).trim(),
          // Position 213-214: status NUM(2)
          status: line.substring(213, 215).trim(),
          // Position 216-227: government_cess NUM(11,2) - 12 chars
          governmentCess: parseFloat(line.substring(216, 228).trim()) || 0,
          // Position 228-277: trade_report_id CHAR(50)
          tradeReportId: line.substring(228, 278).trim(),
          // Position 279-289: order_source CHAR(11)
          orderSource: line.substring(279, 290).trim(),
          // Position 291-295: consolidation_no NUM(5)
          consolidationNo: line.substring(291, 296).trim(),
          // Position 297-306: date_settlement CHAR(10)
          settlementDate: line.substring(297, 307).trim(),
          // Computed fields for display
          companySymbol: line.substring(38, 42).trim(), // Use company_id as symbol
          clientAccount: (line.substring(98, 108).trim() + line.substring(108, 110).trim()).trim() // client_prefix + client_suffix
        };
        transactions.push(transaction);
      } catch (error) {
        console.error('Error parsing line:', line, error);
      }
    });

    return transactions;
  };

  const handleFileUpload = async (files) => {
    const newFiles = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toLocaleDateString(),
      file: file
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Process text files immediately
    for (const fileObj of newFiles) {
      const isTextFile = fileObj.name.toLowerCase().endsWith('.txt');
      
      if (isTextFile) {
        try {
          const textContent = await readTextFile(fileObj.file);
          setExtractedText(prev => prev + `\n\n--- ${fileObj.name} ---\n${textContent}`);
          
          // Parse transaction data
          const parsedTransactions = parseTransactionData(textContent);
          setParsedData(parsedTransactions);
        } catch (error) {
          console.error('Error reading text file:', error);
        }
      }
    }
  };

  const extractTextFromPdf = async (fileObj) => {
    try {
      setIsExtracting(true);
      const result = await tradeSummaryAPI.extractPdfText(fileObj.file);
      
      if (result.success) {
        setExtractedText(prev => prev + `\n\n--- ${fileObj.name} ---\n${result.text}`);
        
        // If we have parsed data, display it in a structured format
        if (result.parsedData && !result.parsedData.error) {
          const structuredData = formatParsedData(result.parsedData);
          setExtractedText(prev => prev + `\n\n=== STRUCTURED DATA ===\n${structuredData}`);
        }
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      // You could show an error message to the user here
    } finally {
      setIsExtracting(false);
    }
  };

  const formatParsedData = (parsedData) => {
    let formatted = '';
    
    if (parsedData.header) {
      formatted += 'HEADER INFORMATION:\n';
      if (parsedData.header.brokerName) formatted += `Broker: ${parsedData.header.brokerName}\n`;
      if (parsedData.header.address) formatted += `Address: ${parsedData.header.address}\n`;
      if (parsedData.header.tel) formatted += `Tel: ${parsedData.header.tel}\n`;
      if (parsedData.header.fax) formatted += `Fax: ${parsedData.header.fax}\n`;
      if (parsedData.header.email) formatted += `Email: ${parsedData.header.email}\n`;
      formatted += '\n';
    }
    
    if (parsedData.clientInfo) {
      formatted += 'CLIENT INFORMATION:\n';
      if (parsedData.clientInfo.accountNo) formatted += `Account No: ${parsedData.clientInfo.accountNo}\n`;
      if (parsedData.clientInfo.clientName) formatted += `Client Name: ${parsedData.clientInfo.clientName}\n`;
      formatted += '\n';
    }
    
    if (parsedData.metadata) {
      formatted += 'TRADE METADATA:\n';
      if (parsedData.metadata.tradeDate) formatted += `Trade Date: ${parsedData.metadata.tradeDate}\n`;
      if (parsedData.metadata.settlementDate) formatted += `Settlement Date: ${parsedData.metadata.settlementDate}\n`;
      formatted += '\n';
    }
    
    if (parsedData.transactions && parsedData.transactions.length > 0) {
      formatted += `TRANSACTIONS (${parsedData.transactions.length} found):\n`;
      parsedData.transactions.forEach((txn, index) => {
        formatted += `\nTransaction ${index + 1}:\n`;
        formatted += `  Date: ${txn.tradeDate}\n`;
        formatted += `  Contract: ${txn.contractNo}\n`;
        formatted += `  Shares: ${txn.shares}\n`;
        formatted += `  Price: ${txn.price}\n`;
        formatted += `  Gross Amount: ${txn.grossAmount}\n`;
        formatted += `  Net Amount: ${txn.netAmount}\n`;
        formatted += `  Settlement: ${txn.settlementDate}\n`;
      });
      formatted += '\n';
    }
    
    if (parsedData.summary) {
      formatted += 'SUMMARY:\n';
      if (parsedData.summary.totalShares) formatted += `Total Shares: ${parsedData.summary.totalShares}\n`;
      if (parsedData.summary.totalGrossAmount) formatted += `Total Gross Amount: ${parsedData.summary.totalGrossAmount}\n`;
      if (parsedData.summary.totalNetAmount) formatted += `Total Net Amount: ${parsedData.summary.totalNetAmount}\n`;
      if (parsedData.summary.salesTotal) formatted += `Sales Total: ${parsedData.summary.salesTotal}\n`;
    }
    
    return formatted;
  };

  const handleSubmit = () => {
    if (parsedData.length === 0) {
      setSubmitMessage('No parsed data to submit. Please upload and parse a trade report file first.');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }
    setShowSubmitModal(true);
  };

  const handleCloseModal = () => {
    setShowSubmitModal(false);
  };

  const handleSaveBuyTransactions = async () => {
    const buyTransactions = parsedData.filter(t => t.buySell === 'B' || t.buySell === 'b');
    
    if (buyTransactions.length === 0) {
      setShowSubmitModal(false);
      setSubmitMessage('No buy transactions to save.');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    setShowSubmitModal(false);
    setIsSaving(true);
    setSubmitMessage('');

    try {
      // Remove the computed fields before sending
      const transactionsToSave = buyTransactions.map(({ id, companySymbol, clientAccount, ...rest }) => rest);
      
      const result = await parsedTradeTransactionAPI.saveParsedTransactions(transactionsToSave);
      
      setSubmitMessage(`Successfully saved ${result.rowsProcessed || buyTransactions.length} buy transaction records to database.`);
      setTimeout(() => setSubmitMessage(''), 5000);
    } catch (error) {
      console.error('Error saving buy transactions:', error);
      
      let errorMessage = 'Error saving buy transactions. Please try again.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
        if (error.response.data.details) {
          errorMessage += `: ${error.response.data.details}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitMessage(errorMessage);
      setTimeout(() => setSubmitMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSellTransactions = async () => {
    const sellTransactions = parsedData.filter(t => t.buySell === 'S' || t.buySell === 's');
    
    if (sellTransactions.length === 0) {
      setShowSubmitModal(false);
      setSubmitMessage('No sell transactions to save.');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    setShowSubmitModal(false);
    setIsSaving(true);
    setSubmitMessage('');

    try {
      // Remove the computed fields before sending
      const transactionsToSave = sellTransactions.map(({ id, companySymbol, clientAccount, ...rest }) => rest);
      
      const result = await parsedTradeTransactionAPI.saveParsedTransactions(transactionsToSave);
      
      setSubmitMessage(`Successfully saved ${result.rowsProcessed || sellTransactions.length} sell transaction records to database.`);
      setTimeout(() => setSubmitMessage(''), 5000);
    } catch (error) {
      console.error('Error saving sell transactions:', error);
      
      let errorMessage = 'Error saving sell transactions. Please try again.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
        if (error.response.data.details) {
          errorMessage += `: ${error.response.data.details}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitMessage(errorMessage);
      setTimeout(() => setSubmitMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllTransactions = async () => {
    setShowSubmitModal(false);
    // Call the actual save function to save all transactions
    await handleSaveTransactions();
  };

  const handleExportToCSV = () => {
    // Convert parsed data to CSV
    const headers = Object.keys(parsedData[0] || {}).join(',');
    const rows = parsedData.map(t => Object.values(t).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-executions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setShowSubmitModal(false);
    setSubmitMessage('Transactions exported to CSV successfully.');
    setTimeout(() => setSubmitMessage(''), 3000);
  };

  const handleReviewData = () => {
    setShowSubmitModal(false);
    setSelectedView('parsed');
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    
    try {
      // Clear existing parsed data and extracted text
      setParsedData([]);
      setExtractedText('');
      
      // Re-process all uploaded text files
      const textFiles = uploadedFiles.filter(file => 
        file.name.toLowerCase().endsWith('.txt') || 
        file.name.toLowerCase().endsWith('.text')
      );
      
      if (textFiles.length > 0) {
        let allParsedData = [];
        let allExtractedText = '';
        
        for (const fileObj of textFiles) {
          try {
            const textContent = await readTextFile(fileObj.file);
            allExtractedText += `\n\n--- ${fileObj.name} ---\n${textContent}`;
            
            // Parse transaction data
            const parsedTransactions = parseTransactionData(textContent);
            allParsedData = [...allParsedData, ...parsedTransactions];
          } catch (error) {
            console.error(`Error re-processing file ${fileObj.name}:`, error);
          }
        }
        
        setExtractedText(allExtractedText);
        setParsedData(allParsedData);
        
        setSubmitMessage(`Successfully refreshed ${allParsedData.length} transaction records from ${textFiles.length} file(s).`);
        setTimeout(() => setSubmitMessage(''), 3000);
      } else {
        setSubmitMessage('No text files found to refresh. Please upload trade report files first.');
        setTimeout(() => setSubmitMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setSubmitMessage('Error refreshing data. Please try again.');
      setTimeout(() => setSubmitMessage(''), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveTransactions = async () => {
    console.log('Save Transactions button clicked');
    console.log('Parsed data length:', parsedData.length);
    
    if (parsedData.length === 0) {
      setSubmitMessage('No parsed data to save. Please upload and parse a trade report file first.');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }

    setIsSaving(true);
    setSubmitMessage('');

    try {
      console.log('Saving transactions...', parsedData.length, 'records');
      
      // Remove the computed 'id' field before sending (it's just for display)
      const transactionsToSave = parsedData.map(({ id, companySymbol, clientAccount, ...rest }) => rest);
      
      console.log('Transactions to save (first record):', transactionsToSave[0]);
      
      const result = await parsedTradeTransactionAPI.saveParsedTransactions(transactionsToSave);
      
      console.log('Save result:', result);
      
      const savedCount = result.rowsProcessed || result.uniqueSaved || 0;
      const duplicatesCount = result.duplicatesSkipped || 0;
      
      let message = '';
      
      if (savedCount > 0 && duplicatesCount > 0) {
        // Some saved, some duplicates
        message = `Successfully saved ${savedCount} transaction record(s). ${duplicatesCount} duplicate transaction(s) skipped.`;
      } else if (savedCount > 0) {
        // All saved, no duplicates
        message = `Successfully saved ${savedCount} transaction record(s) to database.`;
      } else if (duplicatesCount > 0) {
        // All duplicates, nothing saved
        message = `${duplicatesCount} duplicate transaction(s) skipped. No new transactions saved.`;
      } else {
        // Fallback
        message = 'Transactions processed.';
      }
      
      setSubmitMessage(message);
      setTimeout(() => setSubmitMessage(''), 7000);
    } catch (error) {
      console.error('Error saving transactions:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Error saving transactions. Please try again.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || errorMessage;
        if (error.response.data.details) {
          errorMessage += `: ${error.response.data.details}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setSubmitMessage(errorMessage);
      setTimeout(() => setSubmitMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderDocuments = () => (
    <div className="tr-documents-section">
      <h3>Document Management</h3>
      <p className="tr-documents-description">
        Upload and manage PDF and text documents related to this trade report. Supported formats: PDF and text files.
      </p>
      
      {extractedText && (
        <div className="tr-view-text-banner">
          <span>Text has been extracted from PDF and text files</span>
          <button 
            className="tr-view-text-btn"
            onClick={() => document.querySelector('.tr-extracted-text-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            View Extracted Text
          </button>
        </div>
      )}
      
      <div className="tr-upload-section">
        <div 
          className={`tr-file-drop-zone ${dragActive ? 'tr-drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="tr-upload-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="tr-upload-text">
            <h4>Drag & Drop PDF and Text files here</h4>
            <p>or</p>
            <label htmlFor="file-upload" className="tr-upload-button">
              Choose Files
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.txt,.text"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="tr-uploaded-files">
          <h4>Uploaded Documents ({uploadedFiles.length})</h4>
          <div className="tr-files-list">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="tr-file-item">
                <div className="tr-file-info">
                  <div className="tr-file-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="tr-file-details">
                    <span className="tr-file-name">{file.name}</span>
                    <span className="tr-file-meta">
                      {formatFileSize(file.size)} • Uploaded on {file.uploadDate}
                    </span>
                  </div>
                </div>
                <div className="tr-file-actions">
                  <button 
                    className="tr-download-btn"
                    onClick={() => window.open(URL.createObjectURL(file.file), '_blank')}
                    title="Download file"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 21.4142C3.21071 21.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {file.type === 'application/pdf' && (
                    <button 
                      className="tr-extract-btn"
                      onClick={() => extractTextFromPdf(file)}
                      title="Extract text from PDF"
                      disabled={isExtracting}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  {file.name.toLowerCase().endsWith('.txt') && (
                    <button 
                      className="tr-read-btn"
                      onClick={() => readTextFile(file.file).then(text => 
                        setExtractedText(prev => prev + `\n\n--- ${file.name} ---\n${text}`)
                      )}
                      title="Read text file"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 6C4 5.44772 4.44772 5 5 5H19C19.5523 5 20 5.44772 20 6V18C20 18.5523 19.5523 19 19 19H5C4.44772 19 4 18.5523 4 18V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  <button 
                    className="tr-remove-btn"
                    onClick={() => removeFile(file.id)}
                    title="Remove file"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tr-documents-info">
        <h4>Document Guidelines</h4>
        <ul>
          <li>PDF and text files are supported</li>
          <li>Maximum file size: 10MB per file</li>
          <li>Uploaded documents are stored locally in your browser</li>
          <li>Documents are not automatically saved to the server</li>
        </ul>
      </div>

      {extractedText && (
        <div className="tr-extracted-text-section">
          <h4>Extracted Text from PDFs and Text Files</h4>
          <div className="tr-text-display">
            {isExtracting && (
              <div className="tr-extracting-indicator">
                <span>Extracting text...</span>
              </div>
            )}
            <pre className="tr-extracted-content">{extractedText}</pre>
            <div className="tr-text-actions">
              <button 
                className="tr-copy-btn"
                onClick={() => navigator.clipboard.writeText(extractedText)}
                title="Copy to clipboard"
              >
                Copy Text
              </button>
              <button 
                className="tr-submit-btn"
                onClick={handleSubmit}
                title="Submit parsed transaction data"
                disabled={parsedData.length === 0}
              >
                Submit
              </button>
              <button 
                className="tr-clear-btn"
                onClick={() => setExtractedText('')}
                title="Clear extracted text"
              >
                Clear Text
              </button>
            </div>
            {submitMessage && (
              <div className={`tr-submit-message ${submitMessage.includes('Successfully') ? 'success' : 'error'}`}>
                {submitMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderParsedData = () => {
    if (parsedData.length === 0) {
      return (
        <div className="tr-parsed-data-section">
          <div className="tr-no-data-message">
            <h3>No Parsed Data Available</h3>
            <p>Upload a text file to see parsed transaction data here.</p>
          </div>
        </div>
      );
    }

    // Calculate BUY and SELL counts
    const buyCount = parsedData.filter(t => t.buySell === 'B' || t.buySell === 'b').length;
    const sellCount = parsedData.filter(t => t.buySell === 'S' || t.buySell === 's').length;

    return (
      <div className="tr-parsed-data-section">
        <div className="tr-parsed-header">
          <div className="tr-parsed-title-row">
        <h3>Parsed Transaction Data ({parsedData.length} records)</h3>
            <button 
              className="tr-update-portfolio-btn"
              onClick={handleSaveTransactions}
              disabled={isSaving || parsedData.length === 0}
              title="Save parsed transactions to database"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={isSaving ? 'spinning' : ''}
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              {isSaving ? 'Saving...' : 'Save Transactions'}
            </button>
          </div>
          <div className="tr-execution-summary">
            <div className="tr-summary-item">
              <span className="tr-summary-label">BUY Executions:</span>
              <span className="tr-summary-value tr-buy">{buyCount}</span>
            </div>
            <div className="tr-summary-item">
              <span className="tr-summary-label">SELL Executions:</span>
              <span className="tr-summary-value tr-sell">{sellCount}</span>
            </div>
          </div>
        </div>
        {submitMessage && (
          <div className={`tr-submit-message ${submitMessage.includes('Successfully') || submitMessage.includes('saved') ? 'success' : 'error'}`}>
            {submitMessage}
          </div>
        )}
        <div className="tr-parsed-table-container">
          <table className="tr-parsed-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>B/S</th>
                <th>Execution ID</th>
                <th>Company ID</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Brokerage</th>
                <th>CDS Fees</th>
                <th>CSE Fees</th>
                <th>Clearing Fees</th>
                <th>Sec Cess</th>
                <th>Foreign Brokerage</th>
                <th>Gov Cess</th>
                <th>Buy Broker</th>
                <th>Sell Broker</th>
                <th>Buy Contract</th>
                <th>Sell Contract</th>
                <th>Client Account</th>
                <th>Order ID</th>
                <th>Status</th>
                <th>Settlement</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.tradeDate}</td>
                  <td>{transaction.tradeTime}</td>
                  <td className={transaction.buySell === 'B' ? 'tr-buy' : 'tr-sell'}>
                    {transaction.buySell}
                  </td>
                  <td>{transaction.executionId}</td>
                  <td>{transaction.companyId || transaction.companySymbol}</td>
                  <td>{formatNumber(transaction.quantity)}</td>
                  <td>{formatCurrency(transaction.price)}</td>
                  <td>{formatCurrency(transaction.brokerage)}</td>
                  <td>{formatCurrency(transaction.cdsFees)}</td>
                  <td>{formatCurrency(transaction.cseFees)}</td>
                  <td>{formatCurrency(transaction.clearingFees)}</td>
                  <td>{formatCurrency(transaction.secCess)}</td>
                  <td>{formatCurrency(transaction.foreignBrokerage)}</td>
                  <td>{formatCurrency(transaction.governmentCess)}</td>
                  <td>{transaction.buyingBroker}</td>
                  <td>{transaction.sellingBroker}</td>
                  <td>{transaction.buyingContractNo}</td>
                  <td>{transaction.sellingContractNo}</td>
                  <td>{transaction.clientAccount || `${transaction.clientPrefix || ''}${transaction.clientSuffix || ''}`}</td>
                  <td>{transaction.orderId}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.settlementDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // CSV Parsing Functions - Read CSV as-is without interpretation
  const parseCSV = (text) => {
    // Normalize line endings (handle both \r\n and \n)
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');
    
    if (lines.length === 0) return { headers: [], data: [] };
    
    // Parse CSV properly handling quoted fields
    const parseCSVLine = (line) => {
      const values = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];
        
        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            currentValue += '"';
            j++; // Skip next quote
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      // Always add the last value, even if line doesn't end with comma
      values.push(currentValue);
      return values;
    };
    
    // Exact column headers as they appear in the CSV
    const exactHeaders = [
      'Client A/C No', 'Client Name', 'Contract Number', 'Trade Date', 'Buy/Sell Type',
      'Stock Code', 'No of Shares', 'Price', 'Value', 'Trans. Cost',
      'Settlement Amount', 'Settlement Date', 'Order No', 'Trader ID', 'Foreign Brokerage',
      'Staff Member', 'Group Staff Member', 'Related Party', 'Relationship', 'Broker Fees',
      'SEC Fees', 'Exchange Fees', 'CDS Fees', 'GOV Fees', 'Clearing Fees',
      'Order Source', 'Mobile Number'
    ];
    
    // Key identifiers to find the header row
    const headerIdentifiers = ['Client A/C No', 'Client Name', 'Contract Number', 'Trade Date', 'Buy/Sell Type', 'Stock Code'];
    
    // Find the header line by looking for the exact header row
    let headerLineIndex = -1;
    
    // Check first 30 lines to find the header row
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const trimmed = lines[i].trim();
      if (!trimmed || !trimmed.includes(',')) continue;
      
      const values = parseCSVLine(trimmed);
      const normalizedValues = values.map(v => v.trim());
      
      // Check if this row starts with the expected header identifiers
      let matches = 0;
      for (let j = 0; j < Math.min(headerIdentifiers.length, normalizedValues.length); j++) {
        if (normalizedValues[j] === headerIdentifiers[j] || 
            normalizedValues[j].toUpperCase() === headerIdentifiers[j].toUpperCase()) {
          matches++;
        }
      }
      
      // If we found a row that matches the first few headers, it's likely the header row
      if (matches >= 3) {
        headerLineIndex = i;
        console.log('Found header row at index:', i, 'with', matches, 'matches');
        break;
      }
    }
    
    // Fallback: if we didn't find exact match, look for row with most columns (should be 27+)
    if (headerLineIndex === -1) {
      let maxColumns = 0;
      for (let i = 0; i < Math.min(30, lines.length); i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || !trimmed.includes(',')) continue;
        
        const values = parseCSVLine(trimmed);
        if (values.length >= 27 && values.length > maxColumns) {
          maxColumns = values.length;
          headerLineIndex = i;
        }
      }
    }
    
    // Parse headers from the identified header line
    let headers = [];
    if (headerLineIndex >= 0) {
      const headerLine = lines[headerLineIndex];
      const headerValues = parseCSVLine(headerLine);
      
      console.log('Header line index:', headerLineIndex);
      console.log('Header line parsed:', headerLine);
      console.log('Header values count:', headerValues.length);
      
      headers = headerValues.map((h, index) => {
        // Remove quotes and trim
        let cleaned = h.trim();
        if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
            (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
          cleaned = cleaned.slice(1, -1);
        }
        // Use cleaned value or fallback to exact header name if available
        return cleaned || (exactHeaders[index] || `Column ${index + 1}`);
      });
      
      console.log('Parsed headers:', headers);
      console.log('Header count:', headers.length);
    } else {
      // If we couldn't find header row, use the exact headers
      console.warn('Could not find header row, using predefined headers');
      headers = [...exactHeaders];
    }
    
    console.log('Processed headers count:', headers.length);
    console.log('Processed headers:', headers);
    
    // Parse data rows - keep everything as-is
    const data = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      // Ensure we have the same number of values as headers (pad with empty strings if needed)
      while (values.length < headers.length) {
        values.push('');
      }
      
      // Create object from headers and values - preserve all data as-is
      const row = {};
      headers.forEach((header, index) => {
        // Keep value exactly as it appears in CSV
        let value = values[index] || '';
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        row[header] = value;
      });
      
      // Add row even if some values are empty - preserve all rows
      data.push(row);
    }
    
    console.log('Total rows parsed:', data.length);
    if (data.length > 0) {
      console.log('First row column count:', Object.keys(data[0]).length);
      console.log('First row keys:', Object.keys(data[0]));
    }
    
    return { headers, data };
  };

  const readCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleCSVUpload = async (file) => {
    setCsvLoading(true);
    setCsvError('');
    setCsvFile(file);
    
    try {
      const text = await readCSVFile(file);
      const { headers, data } = parseCSV(text);
      
      setCsvHeaders(headers);
      setCsvData(data);
      setCsvPreviewData(data); // Show all rows
      
      console.log('CSV parsed successfully:', {
        headers,
        headerCount: headers.length,
        rowCount: data.length,
        sampleRow: data[0],
        allHeaders: headers
      });
      
      // Debug: Log to ensure all columns are present
      if (data.length > 0) {
        console.log('First row keys:', Object.keys(data[0]));
        console.log('Headers vs Row keys match:', headers.length === Object.keys(data[0]).length);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setCsvError(`Error parsing CSV file: ${error.message}`);
      setCsvData([]);
      setCsvHeaders([]);
      setCsvPreviewData([]);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleCSVDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCsvDragActive(true);
    } else if (e.type === "dragleave") {
      setCsvDragActive(false);
    }
  };

  const handleCSVDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCsvDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        handleCSVUpload(file);
      } else {
        setCsvError('Please upload a CSV file.');
      }
    }
  };

  const handleCSVFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        handleCSVUpload(file);
      } else {
        setCsvError('Please upload a CSV file.');
      }
    }
  };

  const clearCSVData = () => {
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setCsvPreviewData([]);
    setCsvError('');
  };

  // Identify transaction type from CSV data (optional - only if transaction type column exists)
  const getTransactionType = (row) => {
    // Check if there's a column that might indicate transaction type
    const transactionTypeColumns = ['Transaction Type', 'Type', 'Buy/Sell', 'B/S', 'Transaction', 'Txn Type'];
    
    for (const colName of transactionTypeColumns) {
      if (row[colName]) {
        const value = String(row[colName]).toUpperCase().trim();
        if (value === 'BUY' || value === 'B' || value === 'PURCHASE' || value === 'P') return 'BUY';
        if (value === 'SELL' || value === 'S' || value === 'SALE') return 'SELL';
        return value; // Return the actual value if it exists
      }
    }
    
    return ''; // Return empty if no transaction type column found
  };

  const renderPortfolioUpdate = () => (
    <div className="tr-portfolio-update-section">
      <div className="tr-csv-import-container">
        <div className="tr-csv-import-header">
          <h3>CSV Import - Monthly Portfolio Updates</h3>
          <p className="tr-csv-description">
            Upload a CSV file containing transaction data. The system will automatically extract buy (B) and sell (S) transactions along with all other data columns.
          </p>
        </div>

        {/* CSV Upload Section */}
        <div className="tr-csv-upload-section">
          <div 
            className={`tr-csv-drop-zone ${csvDragActive ? 'tr-csv-drag-active' : ''}`}
            onDragEnter={handleCSVDrag}
            onDragLeave={handleCSVDrag}
            onDragOver={handleCSVDrag}
            onDrop={handleCSVDrop}
          >
            <div className="tr-csv-upload-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="tr-csv-upload-text">
              <h4>Drag & Drop CSV file here</h4>
              <p>or</p>
              <label htmlFor="csv-file-upload" className="tr-csv-upload-button">
                Choose CSV File
                <input
                  id="csv-file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileInput}
                  style={{ display: 'none' }}
                />
              </label>
              {csvFile && (
                <div className="tr-csv-file-info">
                  <span>Selected: {csvFile.name}</span>
                  <button 
                    type="button" 
                    className="tr-csv-clear-btn"
                    onClick={clearCSVData}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {csvLoading && (
          <div className="tr-csv-loading">
            <div className="tr-spinner"></div>
            <span>Parsing CSV file...</span>
          </div>
        )}

        {/* Error Message */}
        {csvError && (
          <div className="tr-csv-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{csvError}</span>
          </div>
        )}

        {/* Save Message */}
        {saveMessage && (
          <div className={`tr-csv-message ${saveMessage.includes('Successfully') ? 'tr-csv-message-success' : 'tr-csv-message-error'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {saveMessage.includes('Successfully') ? (
                <path d="M20 6L9 17l-5-5"/>
              ) : (
                <circle cx="12" cy="12" r="10"/>
              )}
            </svg>
            <span>{saveMessage}</span>
          </div>
        )}

        {/* CSV Summary */}
        {csvData.length > 0 && !csvLoading && (
          <div className="tr-csv-summary">
            <div className="tr-csv-summary-stats">
              <div className="tr-csv-stat-item">
                <span className="tr-csv-stat-label">Total Rows:</span>
                <span className="tr-csv-stat-value">{csvData.length}</span>
              </div>
              <div className="tr-csv-stat-item">
                <span className="tr-csv-stat-label">Total Columns:</span>
                <span className="tr-csv-stat-value">{csvHeaders.length}</span>
              </div>
              {csvHeaders.length > 0 && (
                <div className="tr-csv-stat-item">
                  <span className="tr-csv-stat-label">File Name:</span>
                  <span className="tr-csv-stat-value" style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                    {csvFile?.name || 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CSV Preview Table */}
        {csvData.length > 0 && !csvLoading && (
          <div className="tr-csv-preview-section">
            <div className="tr-csv-preview-header">
              <h4>All Data ({csvData.length} rows × {csvHeaders.length} columns)</h4>
              <button 
                className="tr-csv-save-btn"
                onClick={async () => {
                  // Save CSV data to backend
                  if (csvData.length === 0) {
                    alert('No data to save. Please upload a CSV file first.');
                    return;
                  }
                  
                  setIsSavingCSV(true);
                  setSaveMessage('');
                  
                  try {
                    console.log('Saving CSV data:', csvData.length, 'rows');
                    const result = await monthlyPortfolioUpdateAPI.saveMonthlyPortfolioData(csvData);
                    
                    if (result.success) {
                      setSaveMessage(`Successfully saved ${result.inserted} records to database!`);
                      setTimeout(() => setSaveMessage(''), 5000);
                    } else {
                      setSaveMessage(`Error: ${result.error || 'Failed to save data'}`);
                      setTimeout(() => setSaveMessage(''), 5000);
                    }
                  } catch (error) {
                    console.error('Error saving CSV data:', error);
                    setSaveMessage(`Error saving data: ${error.message || 'Unknown error'}`);
                    setTimeout(() => setSaveMessage(''), 5000);
                  } finally {
                    setIsSavingCSV(false);
                  }
                }}
                disabled={isSavingCSV || csvData.length === 0}
              >
                {isSavingCSV ? 'Saving...' : 'Save Data'}
              </button>
            </div>
            <div className="tr-csv-table-container">
              <table className="tr-csv-preview-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {csvHeaders.map((header, index) => (
                      <th key={index}>{header || `Column ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="tr-row-number">{rowIndex + 1}</td>
                      {csvHeaders.map((header, colIndex) => {
                        const cellValue = row[header] || '';
                        return (
                          <td key={colIndex} title={cellValue}>
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tr-csv-preview-footer">
              <p>Showing all {csvData.length} rows with {csvHeaders.length} columns. Use horizontal and vertical scroll to view all data.</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {csvData.length === 0 && !csvLoading && !csvError && (
          <div className="tr-csv-empty-state">
            <div className="tr-csv-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h4>No CSV file uploaded</h4>
            <p>Upload a CSV file to start importing transaction data.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="tr-equity-module-main-container">
      <div className="tr-page-header-section">
        <div className="tr-header-content-wrapper">
          <div className="tr-header-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="tr-header-text-content">
            <h2>Trade Report</h2>
            <p>Comprehensive trade analysis and reporting</p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="tr-main-tabs-section">
        <div className="tr-main-tabs">
          <button 
            className={`tr-main-tab ${mainTab === 'daily-updates' ? 'tr-main-tab-active' : ''}`}
            onClick={() => setMainTab('daily-updates')}
          >
            Daily Updates
          </button>
          <button 
            className={`tr-main-tab ${mainTab === 'portfolio-update' ? 'tr-main-tab-active' : ''}`}
            onClick={() => setMainTab('portfolio-update')}
          >
            Portfolio Update - Monthly Updates
          </button>
        </div>
      </div>

      {/* Daily Updates Tab Content */}
      {mainTab === 'daily-updates' && (
        <>
          <div className="tr-controls-section">
        <div className="tr-view-tabs">
          <button 
            className={selectedView === 'documents' ? 'tr-active' : ''}
            onClick={() => setSelectedView('documents')}
          >
            Documents
          </button>
          <button 
            className={selectedView === 'overview' ? 'tr-active' : ''}
            onClick={() => setSelectedView('overview')}
          >
            Overview
          </button>
          <button 
            className={selectedView === 'sales' ? 'tr-active' : ''}
            onClick={() => setSelectedView('sales')}
          >
            Sales
          </button>
          <button 
            className={selectedView === 'purchases' ? 'tr-active' : ''}
            onClick={() => setSelectedView('purchases')}
          >
            Purchases
          </button>
          <button 
            className={selectedView === 'client' ? 'tr-active' : ''}
            onClick={() => setSelectedView('client')}
          >
            Client Info
          </button>
          <button 
            className={selectedView === 'parsed' ? 'tr-active' : ''}
            onClick={() => setSelectedView('parsed')}
          >
            Parsed Data
          </button>
          <button 
            className="tr-refresh-btn"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            title="Refresh data"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={isRefreshing ? 'spinning' : ''}
            >
              <path d="M1 4v6h6M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        
        <div className="tr-equity-filter">
          <label htmlFor="equity-select">Filter by Equity:</label>
          <select 
            id="equity-select"
            value={selectedEquity}
            onChange={(e) => setSelectedEquity(e.target.value)}
          >
            <option value="all">All Equities</option>
            {getEquityList().map(equity => (
              <option key={equity} value={equity}>{equity}</option>
            ))}
          </select>
        </div>
      </div>

          <div className="tr-report-content">
            {selectedView === 'documents' && renderDocuments()}
            {selectedView === 'overview' && renderOverview()}
            {selectedView === 'sales' && renderSales()}
            {selectedView === 'purchases' && renderPurchases()}
            {selectedView === 'client' && renderClientInfo()}
            {selectedView === 'parsed' && renderParsedData()}
          </div>
        </>
      )}

      {/* Portfolio Update Tab Content */}
      {mainTab === 'portfolio-update' && (
        <div className="tr-report-content">
          {renderPortfolioUpdate()}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="tr-modal-overlay" onClick={handleCloseModal}>
          <div className="tr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tr-modal-header">
              <h3>Submit Transaction Data</h3>
              <button className="tr-modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
      </div>
            <div className="tr-modal-body">
              <p className="tr-modal-description">
                You have <strong>{parsedData.length}</strong> parsed transaction records ready to submit.
                Choose an action below:
              </p>
              <div className="tr-modal-stats">
                <div className="tr-stat-badge">
                  <span className="tr-stat-label">BUY:</span>
                  <span className="tr-stat-value tr-buy">
                    {parsedData.filter(t => t.buySell === 'B' || t.buySell === 'b').length}
                  </span>
                </div>
                <div className="tr-stat-badge">
                  <span className="tr-stat-label">SELL:</span>
                  <span className="tr-stat-value tr-sell">
                    {parsedData.filter(t => t.buySell === 'S' || t.buySell === 's').length}
                  </span>
                </div>
              </div>
            </div>
            <div className="tr-modal-actions">
              <button 
                className="tr-modal-btn tr-btn-primary"
                onClick={handleSaveBuyTransactions}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12l7-7 7 7"/>
                </svg>
                Save Buy Transactions
              </button>
              <button 
                className="tr-modal-btn tr-btn-secondary"
                onClick={handleSaveSellTransactions}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7 7 7-7"/>
                </svg>
                Save Sell Transactions
              </button>
              <button 
                className="tr-modal-btn tr-btn-success"
                onClick={handleSaveAllTransactions}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Save All Transactions
              </button>
              <button 
                className="tr-modal-btn tr-btn-info"
                onClick={handleExportToCSV}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export to CSV
              </button>
              <button 
                className="tr-modal-btn tr-btn-warning"
                onClick={handleReviewData}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Review Data First
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeReport;
