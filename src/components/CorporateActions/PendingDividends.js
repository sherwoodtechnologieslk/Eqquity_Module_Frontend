import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './Styles/PendingDividends.css';

// Set up PDF.js worker - use local file from public folder (most reliable)
// The worker file should be copied to public folder by running: npm run copy-pdf-worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const PendingDividends = () => {
  const [dividendType, setDividendType] = useState('cash'); // 'cash' or 'stock'
  const [taxRate, setTaxRate] = useState(6); // Tax rate in percentage
  const [isEditingTaxRate, setIsEditingTaxRate] = useState(false);
  const [dividends, setDividends] = useState([
    {
      id: 1,
      name: 'Combank',
      amount: 560,
      price: 600,
      receivedAmount: 560,
      tax: 6,
      status: 'pending',
      type: 'cash',
      recordDate: '2025-01-15',
      paymentDate: '2025-01-20'
    }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [pdfText, setPdfText] = useState(null);
  const [showPdfText, setShowPdfText] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState(null);
  const [detectedLanguages, setDetectedLanguages] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    if (window.confirm('Are you sure you want to remove this PDF file?')) {
      setSelectedFile(null);
      setPdfText(null);
      setShowPdfText(false);
      setPdfArrayBuffer(null);
      setParsedData(null);
      setPdfPassword('');
      setPasswordError('');
      setShowPasswordModal(false);
      // Reset the file input
      const fileInput = document.getElementById('bankStatementFile');
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const extractTextFromPDF = async (file, password = null) => {
    try {
      setIsParsing(true);
      setPasswordError('');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Store arrayBuffer for password retry (create a copy to avoid issues)
      if (!pdfArrayBuffer) {
        // Create a copy of the arrayBuffer to ensure it's not consumed
        const bufferCopy = arrayBuffer.slice(0);
        setPdfArrayBuffer(bufferCopy);
      }
      
      // Use the current arrayBuffer or the stored one
      const bufferToUse = pdfArrayBuffer || arrayBuffer;
      
      // Try to load PDF with optional password
      const loadingTask = pdfjsLib.getDocument({ 
        data: bufferToUse,
        password: password || undefined
      });
      
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      let pageTexts = [];
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        pageTexts.push(`--- Page ${i} ---\n${pageText}`);
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      
      // Filter to keep only English letters, numbers, and symbols
      const filteredText = filterEnglishOnly(fullText);
      
      // Detect languages in the filtered text
      const languages = detectLanguages(filteredText);
      setDetectedLanguages(languages);
      
      // Store the filtered text for display
      setPdfText(filteredText);
      setShowPdfText(true);
      setShowPasswordModal(false);
      setPdfPassword('');
      
      return filteredText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      
      // Check if PDF is password protected
      if (error.name === 'PasswordException' || error.message?.includes('password') || error.message?.includes('encrypted')) {
        setShowPasswordModal(true);
        setPasswordError('This PDF is password protected. Please enter the password.');
        throw new Error('PASSWORD_REQUIRED');
      }
      
      throw error;
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!pdfPassword.trim()) {
      setPasswordError('Please enter a password');
      return;
    }

    if (!pdfArrayBuffer) {
      setPasswordError('PDF file not found. Please upload again.');
      return;
    }

    try {
      setIsParsing(true);
      setPasswordError('');
      
      // Try to load PDF with password directly from arrayBuffer
      const loadingTask = pdfjsLib.getDocument({ 
        data: pdfArrayBuffer,
        password: pdfPassword
      });
      
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      
      // Filter to keep only English letters, numbers, and symbols
      const filteredText = filterEnglishOnly(fullText);
      
      // Detect languages in the filtered text
      const languages = detectLanguages(filteredText);
      setDetectedLanguages(languages);
      
      // Store the filtered text for display
      setPdfText(filteredText);
      setShowPdfText(true);
      setShowPasswordModal(false);
      setPdfPassword('');
      setPasswordError('');
      
      alert('PDF unlocked successfully! Review the extracted text below, then click "Parse & Match" to extract dividend data.');
    } catch (error) {
      console.error('Error unlocking PDF:', error);
      
      // Check if password was wrong
      if (error.name === 'PasswordException' || error.message?.includes('password') || error.message?.includes('encrypted')) {
        setPasswordError('Incorrect password. Please try again.');
        setPdfPassword('');
      } else {
        setPasswordError('Error processing PDF: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsParsing(false);
    }
  };

  // Filter text to keep only English letters, numbers, and common symbols
  const filterEnglishOnly = (text) => {
    // Keep: English letters (A-Z, a-z), numbers (0-9), common symbols, spaces, newlines, and basic punctuation
    // Remove: All other Unicode characters (garbled Sinhala/Tamil, special symbols, etc.)
    return text
      .split('')
      .filter(char => {
        const code = char.charCodeAt(0);
        // Keep ASCII printable characters (32-126): letters, numbers, symbols, space
        // Keep newlines (10) and carriage returns (13)
        // Keep tabs (9)
        return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
      })
      .join('');
  };

  // Detect languages in the extracted text
  const detectLanguages = (text) => {
    const languages = [];
    const sample = text.substring(0, 1000); // Sample first 1000 characters for detection
    
    // Sinhala Unicode range: 0D80-0DFF
    const sinhalaRegex = /[\u0D80-\u0DFF]/;
    // Tamil Unicode range: 0B80-0BFF
    const tamilRegex = /[\u0B80-\u0BFF]/;
    // English (basic Latin)
    const englishRegex = /[A-Za-z]/;
    
    if (sinhalaRegex.test(sample)) {
      languages.push({ code: 'si', name: 'Sinhala', flag: '🇱🇰' });
    }
    if (tamilRegex.test(sample)) {
      languages.push({ code: 'ta', name: 'Tamil', flag: '🇮🇳' });
    }
    if (englishRegex.test(sample)) {
      languages.push({ code: 'en', name: 'English', flag: '🇬🇧' });
    }
    
    return languages.length > 0 ? languages : [{ code: 'unknown', name: 'Unknown', flag: '❓' }];
  };

  const parseDividendData = (text) => {
    const dividendData = [];
    
    // Common patterns to identify dividend information
    // Look for company names, amounts, dates, etc.
    const lines = text.split('\n');
    
    // Pattern matching for dividend entries
    // This is a basic parser - you may need to adjust based on your PDF format
    const amountPattern = /[\d,]+\.?\d*/g;
    const datePattern = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g;
    
    lines.forEach((line) => {
      const upperLine = line.toUpperCase();
      const amounts = line.match(amountPattern);
      const dates = line.match(datePattern);
      
      // Look for dividend-related keywords
      if (upperLine.includes('DIVIDEND') || upperLine.includes('DIV') || 
          upperLine.includes('PAYMENT') || upperLine.includes('CREDIT')) {
        
        // Try to extract company name (usually before dividend keyword)
        const companyMatch = line.match(/([A-Z][A-Z\s&]+(?:PLC|LTD|INC|CORP)?)/i);
        
        if (companyMatch || amounts) {
          const entry = {
            name: companyMatch ? companyMatch[1].trim() : 'Unknown',
            amount: amounts && amounts.length > 0 ? parseFloat(amounts[0].replace(/,/g, '')) : null,
            receivedAmount: amounts && amounts.length > 0 ? parseFloat(amounts[0].replace(/,/g, '')) : null,
            date: dates && dates.length > 0 ? dates[0] : null,
            rawText: line.trim()
          };
          
          dividendData.push(entry);
        }
      }
      
      // Look for table-like structures with amounts (lines with multiple amounts)
      if (amounts && amounts.length >= 2) {
        // Could be a dividend entry with multiple amounts
        const potentialEntry = {
          name: line.substring(0, 30).trim() || 'Unknown',
          amount: parseFloat(amounts[0].replace(/,/g, '')),
          receivedAmount: parseFloat(amounts[1].replace(/,/g, '')),
          rawText: line.trim()
        };
        
        // Only add if it looks like a valid entry
        if (potentialEntry.amount > 0 && potentialEntry.name.length > 2) {
          dividendData.push(potentialEntry);
        }
      }
    });
    
    return dividendData;
  };

  const matchDividendsWithPDF = (pdfDividends) => {
    // Match PDF data with existing dividends
    const updatedDividends = dividends.map(div => {
      // Try to find matching entry from PDF
      const match = pdfDividends.find(pdfDiv => 
        pdfDiv.name.toLowerCase().includes(div.name.toLowerCase()) ||
        div.name.toLowerCase().includes(pdfDiv.name.toLowerCase()) ||
        (Math.abs(pdfDiv.amount - div.amount) < 1) // Amount matches within 1 unit
      );
      
      if (match) {
        return {
          ...div,
          receivedAmount: match.receivedAmount || match.amount || div.receivedAmount,
          status: 'matched'
        };
      }
      
      return div;
    });
    
    // Add new dividends from PDF that weren't in the list
    pdfDividends.forEach(pdfDiv => {
      const exists = updatedDividends.some(div => 
        div.name.toLowerCase() === pdfDiv.name.toLowerCase()
      );
      
      if (!exists && pdfDiv.amount) {
        updatedDividends.push({
          id: Date.now() + Math.random(),
          name: pdfDiv.name,
          amount: pdfDiv.amount,
          price: 0,
          receivedAmount: pdfDiv.receivedAmount || pdfDiv.amount,
          tax: taxRate,
          status: 'pending',
          type: dividendType,
          recordDate: pdfDiv.date || new Date().toISOString().split('T')[0],
          paymentDate: pdfDiv.date || new Date().toISOString().split('T')[0]
        });
      }
    });
    
    return updatedDividends;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a bank statement file to upload');
      return;
    }

    setIsUploading(true);
    
    try {
      // First, extract and show text from PDF
      await extractTextFromPDF(selectedFile);
      
      // Show success message
      alert('PDF read successfully! Review the extracted text below, then click "Parse & Match" to extract dividend data.');
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      
      // If password is required, the modal will be shown by extractTextFromPDF
      if (error.message !== 'PASSWORD_REQUIRED') {
        alert('Error reading PDF file. Please make sure it is a valid PDF file.');
        setPdfText(null);
        setShowPdfText(false);
        setShowPasswordModal(false);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleParseAndMatch = () => {
    if (!pdfText) {
      alert('Please upload and read a PDF first');
      return;
    }

    try {
      // Parse dividend data from text
      const parsedDividends = parseDividendData(pdfText);
      
      if (parsedDividends.length > 0) {
        setParsedData(parsedDividends);
        
        // Match and update dividends
        const updatedDividends = matchDividendsWithPDF(parsedDividends);
        setDividends(updatedDividends);
        
        alert(`Successfully parsed ${parsedDividends.length} dividend entries from PDF!`);
      } else {
        alert('No dividend information found in the PDF. Please check the file format or manually add entries.');
        setParsedData(null);
      }
    } catch (error) {
      console.error('Error parsing PDF data:', error);
      alert('Error parsing dividend data from PDF.');
    }
  };

  const handleMatch = (id) => {
    setDividends(prev => prev.map(div => 
      div.id === id ? { ...div, status: 'matched' } : div
    ));
    alert('Dividend matched successfully!');
  };

  const handleCancel = (id) => {
    if (window.confirm('Are you sure you want to cancel this dividend entry?')) {
      setDividends(prev => prev.filter(div => div.id !== id));
    }
  };

  const handleTaxRateChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setTaxRate(value);
    }
  };

  const handleTaxRateBlur = () => {
    setIsEditingTaxRate(false);
  };

  const handleTaxRateClick = () => {
    setIsEditingTaxRate(true);
  };

  const calculateTaxAmount = (amount, taxPercent) => {
    return ((amount * taxPercent) / 100).toFixed(2);
  };

  const calculateNetAmount = (amount, taxPercent) => {
    return (amount - (amount * taxPercent) / 100).toFixed(2);
  };

  const filteredDividends = dividends.filter(div => div.type === dividendType);

  return (
    <div className="pending-div-page-container">
      <div className="pending-div-content-wrapper">
        <div className="pending-div-header-section">
          <div className="pending-div-header-text-group">
            <p className="pending-div-eyebrow">Corporate Actions</p>
            <h1 className="pending-div-main-title">Pending Dividends</h1>
            <p className="pending-div-subtitle">Reconcile dividend payments with bank statements</p>
          </div>
        </div>

        {/* Dividend Type Buttons */}
        <div className="pending-div-buttons-section">
          <button
            className={`pending-div-type-btn ${dividendType === 'cash' ? 'active' : ''}`}
            onClick={() => setDividendType('cash')}
          >
            Cash Dividends
          </button>
          <button
            className={`pending-div-type-btn ${dividendType === 'stock' ? 'active' : ''}`}
            onClick={() => setDividendType('stock')}
          >
            Stock Dividends
          </button>
        </div>

        {/* PDF Text Display */}
        {showPdfText && pdfText && (
          <div className="pending-div-pdf-display-section">
            <div className="pending-div-pdf-display-header">
              <div className="pending-div-pdf-header-left">
                <h3>Extracted PDF Content</h3>
                {detectedLanguages.length > 0 && (
                  <div className="pending-div-languages">
                    <span className="pending-div-languages-label">Languages detected:</span>
                    {detectedLanguages.map((lang, idx) => (
                      <span key={lang.code} className="pending-div-language-badge">
                        {lang.flag} {lang.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pending-div-pdf-actions">
                <button
                  onClick={handleParseAndMatch}
                  className="pending-div-parse-btn"
                >
                  Parse & Match Dividends
                </button>
                <button
                  onClick={() => setShowPdfText(false)}
                  className="pending-div-close-btn"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="pending-div-pdf-text-container">
              <pre className="pending-div-pdf-text">{pdfText}</pre>
            </div>
          </div>
        )}

        {/* Parsed Data Display */}
        {parsedData && parsedData.length > 0 && (
          <div className="pending-div-parsed-info">
            <p>
              Found {parsedData.length} dividend {parsedData.length === 1 ? 'entry' : 'entries'} in PDF
            </p>
          </div>
        )}

        {/* Bank Statement Upload Section */}
        <div className="pending-div-upload-section">
          <div className="pending-div-upload-card">
            <div className="pending-div-upload-header">
              <h2 className="pending-div-upload-title">Bank Statement Upload</h2>
            </div>
            <div className="pending-div-upload-content">
              <div className="pending-div-file-input-wrapper">
                <input
                  type="file"
                  id="bankStatementFile"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleFileChange}
                  className="pending-div-file-input"
                />
                <div className="pending-div-file-label-container">
                  <label htmlFor="bankStatementFile" className="pending-div-file-label">
                    {selectedFile ? selectedFile.name : 'Choose Bank Statement File'}
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="pending-div-file-remove-btn"
                      title="Remove file"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || isParsing}
                className="pending-div-upload-btn"
              >
                {isParsing ? 'Reading PDF...' : isUploading ? 'Processing...' : 'Upload & Match'}
              </button>
            </div>
          </div>
        </div>

        {/* Pending Dividends Table */}
        <div className="pending-div-table-card">
          <div className="pending-div-table-header">
            <h2 className="pending-div-table-title">Pending Dividends</h2>
            <div 
              className={`pending-div-tax-info ${!isEditingTaxRate ? 'pending-div-tax-clickable' : ''}`}
              onClick={!isEditingTaxRate ? handleTaxRateClick : undefined}
              title={!isEditingTaxRate ? "Click to edit tax rate" : undefined}
            >
              <span className="pending-div-tax-label">Tax Rate:</span>
              {isEditingTaxRate ? (
                <input
                  type="number"
                  className="pending-div-tax-input"
                  value={taxRate}
                  onChange={handleTaxRateChange}
                  onBlur={handleTaxRateBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTaxRateBlur();
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  min="0"
                  max="100"
                  step="0.1"
                  autoFocus
                />
              ) : (
                <span className="pending-div-tax-value">
                  {taxRate}%
                </span>
              )}
            </div>
          </div>

          <div className="pending-div-table-wrapper">
            <table className="pending-div-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Price</th>
                  <th>Received Amount</th>
                  <th>Tax ({taxRate}%)</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDividends.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="pending-div-empty">
                      No pending {dividendType === 'cash' ? 'cash' : 'stock'} dividends found
                    </td>
                  </tr>
                ) : (
                  filteredDividends.map((dividend) => (
                    <tr key={dividend.id} className={dividend.status === 'matched' ? 'pending-div-matched' : ''}>
                      <td>{dividend.name}</td>
                      <td>{dividend.amount.toLocaleString()}</td>
                      <td>
                        {dividend.price.toLocaleString()}
                        <svg className="pending-div-check-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </td>
                      <td>{dividend.receivedAmount.toLocaleString()}</td>
                      <td>{calculateTaxAmount(dividend.amount, taxRate)}</td>
                      <td>{calculateNetAmount(dividend.amount, taxRate)}</td>
                      <td>
                        <span className={`pending-div-status pending-div-status-${dividend.status}`}>
                          {dividend.status === 'matched' ? 'Matched' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <div className="pending-div-actions">
                          {dividend.status === 'pending' && (
                            <button
                              onClick={() => handleMatch(dividend.id)}
                              className="pending-div-btn pending-div-btn-match"
                            >
                              Match
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(dividend.id)}
                            className="pending-div-btn pending-div-btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="pending-div-password-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPasswordModal(false);
            setPdfPassword('');
            setPasswordError('');
          }
        }}>
          <div className="pending-div-password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pending-div-password-modal-header">
              <h3>PDF Password Required</h3>
              <button 
                className="pending-div-password-modal-close"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPdfPassword('');
                  setPasswordError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="pending-div-password-modal-content">
              <p className="pending-div-password-modal-message">
                This PDF is password protected. Please enter the password to continue.
              </p>
              {passwordError && (
                <p className="pending-div-password-error">{passwordError}</p>
              )}
              <div className="pending-div-password-input-group">
                <label htmlFor="pdfPassword">Password:</label>
                <input
                  type="password"
                  id="pdfPassword"
                  className="pending-div-password-input"
                  value={pdfPassword}
                  onChange={(e) => {
                    setPdfPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePasswordSubmit();
                    }
                  }}
                  placeholder="Enter PDF password"
                  autoFocus
                />
              </div>
            </div>
            <div className="pending-div-password-modal-actions">
              <button
                className="pending-div-password-btn-cancel"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPdfPassword('');
                  setPasswordError('');
                }}
              >
                Cancel
              </button>
              <button
                className="pending-div-password-btn-submit"
                onClick={handlePasswordSubmit}
                disabled={isParsing || !pdfPassword.trim()}
              >
                {isParsing ? 'Unlocking...' : 'Unlock PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDividends;
