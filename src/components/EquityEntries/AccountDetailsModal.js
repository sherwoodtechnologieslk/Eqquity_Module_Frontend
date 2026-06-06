import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Styles/AccountDetailsModal.css';

const AccountDetailsModal = ({ isOpen, onClose, accountCode, accountData, loadError, detailSource }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const entries = accountData?.entries || [];
  const showSourceColumn = entries.some((e) => e && e.source);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const formatCurrency = (amount) => {
    // Trial Balance uses 3-digit grouping
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const csvEscape = (value) => {
    const s = value == null ? '' : String(value);
    const needsQuotes = /[",\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const handleExportPdf = () => {
    if (!accountData) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const code = accountData.accountCode || accountCode || '';
    const name = accountData.accountName || '';

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(12);
    doc.text('Account Entries', 40, 34);
    doc.setFontSize(9);
    const subtitle = [
      detailSource ? String(detailSource) : null,
      code ? `Account: ${code}${name ? ` — ${name}` : ''}` : null,
      accountData.period?.startDate && accountData.period?.endDate
        ? `Period: ${formatDate(accountData.period.startDate)} - ${formatDate(accountData.period.endDate)}`
        : null
    ]
      .filter(Boolean)
      .join('  •  ');
    if (subtitle) doc.text(subtitle, 40, 50);

    const baseHead = ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Type'];
    const head = showSourceColumn ? ['Source', ...baseHead] : baseHead;

    const rows = (accountData.entries || []).map((e) => {
      const base = [
        formatDate(e.date),
        e.description || '',
        e.reference || '',
        e.debit > 0 ? formatCurrency(e.debit) : '-',
        e.credit > 0 ? formatCurrency(e.credit) : '-',
        e.transaction_type || ''
      ];
      return showSourceColumn ? [e.source || '', ...base] : base;
    });

    const baseColumnStyles = {
      0: { cellWidth: 70 },
      1: { cellWidth: 240 },
      2: { cellWidth: 90 },
      3: { halign: 'right', cellWidth: 70 },
      4: { halign: 'right', cellWidth: 70 },
      5: { cellWidth: 90 }
    };
    const columnStyles = showSourceColumn
      ? {
          0: { cellWidth: 70 },
          1: { cellWidth: 70 },
          2: { cellWidth: 220 },
          3: { cellWidth: 90 },
          4: { halign: 'right', cellWidth: 70 },
          5: { halign: 'right', cellWidth: 70 },
          6: { cellWidth: 90 }
        }
      : baseColumnStyles;

    autoTable(doc, {
      startY: subtitle ? 66 : 54,
      head: [head],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 3, valign: 'top' },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles,
      margin: { left: 40, right: 40 }
    });

    doc.save(`account-entries-${code || 'account'}-${stamp}.pdf`);
  };

  const handleExportCsv = () => {
    if (!accountData) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const code = accountData.accountCode || accountCode || 'account';

    const baseHeader = ['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Type'];
    const header = showSourceColumn ? ['Source', ...baseHeader] : baseHeader;
    const lines = [
      header.map(csvEscape).join(','),
      ...(accountData.entries || []).map((e) => {
        const base = [
          formatDate(e.date),
          e.description || '',
          e.reference || '',
          e.debit || 0,
          e.credit || 0,
          e.transaction_type || ''
        ];
        const cells = showSourceColumn ? [e.source || '', ...base] : base;
        return cells.map(csvEscape).join(',');
      })
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account-entries-${code}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className={`account-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`account-modal-content ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="account-modal-form-card">
          <div className="account-modal-header">
            <div className="account-modal-header-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="account-modal-icon">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM20.05 19L18.64 17.59L17.23 19L18.64 20.41L20.05 19ZM22.88 17.58L20.07 14.77C19.68 14.38 19.05 14.38 18.66 14.77L16.95 16.48L20.17 19.7L21.88 17.99C22.27 17.6 22.27 16.97 21.88 16.58Z"/>
              </svg>
            </div>
            <div className="account-modal-title-section">
              <h2 className="account-modal-title">Account Details</h2>
              <p className="account-modal-subtitle">
                <span className="account-modal-subtitle-text">
                  {detailSource
                    ? `${detailSource} — ${accountData?.accountCode || accountCode}`
                    : `Detailed view for account: ${accountData?.accountCode || accountCode}`}
                </span>
                <span className="account-modal-subtitle-actions">
                  <span
                    className={`account-modal-header-link ${!accountData ? 'disabled' : ''}`}
                    role="button"
                    tabIndex={!accountData ? -1 : 0}
                    onClick={!accountData ? undefined : handleExportPdf}
                    onKeyDown={
                      !accountData
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleExportPdf();
                            }
                          }
                    }
                    title={!accountData ? 'Load account details before exporting' : 'Export entries to PDF'}
                  >
                    Export PDF
                  </span>
                  <span className="account-modal-header-sep">|</span>
                  <span
                    className={`account-modal-header-link ${!accountData ? 'disabled' : ''}`}
                    role="button"
                    tabIndex={!accountData ? -1 : 0}
                    onClick={!accountData ? undefined : handleExportCsv}
                    onKeyDown={
                      !accountData
                        ? undefined
                        : (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleExportCsv();
                            }
                          }
                    }
                    title={!accountData ? 'Load account details before exporting' : 'Export entries to CSV'}
                  >
                    Export CSV
                  </span>
                </span>
              </p>
            </div>
          </div>

          <div className="account-modal-body">
            <div className="account-modal-scroll-container">
              {loadError ? (
                <div className="account-modal-error">
                  <p>{loadError}</p>
                </div>
              ) : accountData ? (
                <div className="account-details-content">
                  {/* Account Summary */}
                  <div className="account-summary-section">
                    <h3 className="section-title">Account Summary</h3>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Account Code:</span>
                        <span className="summary-value">{accountData.accountCode}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Account Name:</span>
                        <span className="summary-value">{accountData.accountName}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Account Type:</span>
                        <span className="summary-value">
                          {accountData.accountCode?.charAt(0) === '1' ? 'Asset' :
                           accountData.accountCode?.charAt(0) === '2' ? 'Liability' :
                           accountData.accountCode?.charAt(0) === '3' ? 'Revenue' :
                           accountData.accountCode?.charAt(0) === '4' ? 'Other' :
                           accountData.accountCode?.charAt(0) === '6' ? 'Expense' :
                           accountData.accountCode?.charAt(0) === '8' ? 'Equity' :
                           accountData.accountCode?.charAt(0) === '9' ? 'Other' : 'Other'}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Balance Type:</span>
                        <span className={`summary-value balance-type ${accountData.totals?.balance_type?.toLowerCase()}`}>
                          {accountData.totals?.balance_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Information */}
                  <div className="balance-section">
                    <h3 className="section-title">Balance Information</h3>
                    <div className="balance-grid">
                      <div className="balance-item">
                        <span className="balance-label">Total Debit:</span>
                        <span className="balance-value debit">
                          {formatCurrency(accountData.totals?.total_debit)}
                        </span>
                      </div>
                      <div className="balance-item">
                        <span className="balance-label">Total Credit:</span>
                        <span className="balance-value credit">
                          {formatCurrency(accountData.totals?.total_credit)}
                        </span>
                      </div>
                      <div className="balance-item">
                        <span className="balance-label">Net Balance:</span>
                        <span className={`balance-value net ${accountData.totals?.balance_type?.toLowerCase()}`}>
                          {formatCurrency(Math.abs(accountData.totals?.net_balance))} {accountData.totals?.balance_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Period Information */}
                  <div className="period-section">
                    <h3 className="section-title">Report Period</h3>
                    <div className="period-grid">
                      <div className="period-item">
                        <span className="period-label">Start Date:</span>
                        <span className="period-value">{formatDate(accountData.period?.startDate)}</span>
                      </div>
                      <div className="period-item">
                        <span className="period-label">End Date:</span>
                        <span className="period-value">{formatDate(accountData.period?.endDate)}</span>
                      </div>
                      <div className="period-item">
                        <span className="period-label">Portfolio:</span>
                        <span className="period-value">{accountData.period?.portfolio}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Entries */}
                  {accountData.entries && accountData.entries.length > 0 && (
                    <div className="entries-section">
                      <h3 className="section-title">Transaction Entries</h3>
                      <div className="entries-table-container">
                        <table className={`entries-table ${showSourceColumn ? 'has-source' : ''}`}>
                          <thead>
                            <tr>
                              {showSourceColumn && <th>Source</th>}
                              <th>Date</th>
                              <th>Description</th>
                              <th>Reference</th>
                              <th>Debit</th>
                              <th>Credit</th>
                              <th>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {accountData.entries.map((entry, index) => (
                              <tr key={index}>
                                {showSourceColumn && (
                                  <td>
                                    <span
                                      className="entry-source-badge"
                                      data-source={entry.source || ''}
                                    >
                                      {entry.source || '—'}
                                    </span>
                                  </td>
                                )}
                                <td>{formatDate(entry.date)}</td>
                                <td>{entry.description}</td>
                                <td>{entry.reference}</td>
                                <td className="debit-amount">
                                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                                </td>
                                <td className="credit-amount">
                                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                                </td>
                                <td>{entry.transaction_type}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* No entries message */}
                  {(!accountData.entries || accountData.entries.length === 0) && (
                    <div className="no-entries">
                      <div className="no-entries-icon">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h4>No Transaction Entries</h4>
                      <p>No detailed entries found for this account in the selected period.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="account-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading account details...</p>
                </div>
              )}
            </div>
          </div>

          <div className="account-modal-footer">
            <button className="account-modal-btn close" onClick={handleClose}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsModal;
