import React, { useState, useEffect, useCallback } from 'react';
import { accountAPI } from '../../services/api';
import './Styles/PaymentMethodModal.css';

const PaymentMethodModal = ({ paymentMethod, onClose, onSelectAccount }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  //const [selectedAccount, setSelectedAccount] = useState(null);

  const transformAccountData = (accountData) => {
    const transformedAccounts = [];
    
    accountData.forEach(account => {
      // Create account object directly from the new database structure
      transformedAccounts.push({
        id: account.id,
        accountName: account.account_name,
        accountNumber: account.account_number,
        bankName: account.bank_name,
        branch: account.branch_name,
        swiftCode: account.swift_code,
        iban: account.iban,
        paymentMethod: account.payment_method
      });
    });
    
    return transformedAccounts;
  };

  const fetchAccountsByPaymentMethod = useCallback(async (method) => {
    try {
      setLoading(true);
      setError('');
      const accountData = await accountAPI.getAccountsByPaymentMethod(method);
      
      // Transform the data from Account Master format to PaymentMethodModal format
      const transformedAccounts = transformAccountData(accountData);
      setAccounts(transformedAccounts);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load settlement accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paymentMethod) {
      setIsVisible(true);
      fetchAccountsByPaymentMethod(paymentMethod);
    }
  }, [paymentMethod, fetchAccountsByPaymentMethod]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAccountSelect = (account) => {
    //setSelectedAccount(account);
    onSelectAccount(account);
    handleClose();
  };


  //const formatKey = (key) =>
    //key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  if (!paymentMethod) return null;

  return (
    <div className={`payment-modal-overlay ${isVisible ? 'visible' : ''}`} onClick={handleClose}>
      <div className={`payment-modal-content ${isVisible ? 'visible' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="payment-modal-form-card">
          <div className="payment-modal-header">
            <div className="payment-modal-header-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="payment-modal-icon">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM20.05 19L18.64 17.59L17.23 19L18.64 20.41L20.05 19ZM22.88 17.58L20.07 14.77C19.68 14.38 19.05 14.38 18.66 14.77L16.95 16.48L20.17 19.7L21.88 17.99C22.27 17.6 22.27 16.97 21.88 16.58Z"/>
              </svg>
            </div>
            <div className="payment-modal-title-section">
              <h2 className="payment-modal-title">Select {paymentMethod} Account</h2>
              <p className="payment-modal-subtitle">Choose an account for {paymentMethod.toLowerCase()} transactions</p>
            </div>
            <button className="payment-modal-close-btn" onClick={handleClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="payment-modal-body">
            <div className="payment-modal-scroll-container">
              {loading ? (
                <div className="payment-modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading settlement accounts...</p>
                </div>
              ) : error ? (
                <div className="payment-modal-error">
                  <div className="error-icon-wrapper">
                    <svg className="payment-modal-error-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3>Error loading accounts</h3>
                  <p>{error}</p>
                </div>
              ) : accounts.length === 0 ? (
                <div className="payment-modal-empty">
                  <div className="empty-icon-wrapper">
                    <svg className="payment-modal-empty-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3>No accounts available</h3>
                  <p>No settlement accounts configured for {paymentMethod.toLowerCase()} payments. Please configure accounts in Account Master first.</p>
                </div>
              ) : (
                <div className="payment-accounts-grid">
                  {accounts.map((account, index) => (
                    <div 
                      key={account.id} 
                      className="payment-account-card"
                      onClick={() => handleAccountSelect(account)}
                    >
                      <div className="account-card-inner">
                        <div className="account-card-header">
                          <div className="account-name">{account.accountName}</div>
                          <div className="account-number">
                            <span className="account-number-label">Account</span>
                            <span className="account-number-value">{account.accountNumber}</span>
                          </div>
                        </div>
                        <div className="account-card-content">
                          <div className="account-detail">
                            <span className="detail-label">Bank</span>
                            <span className="detail-value">{account.bankName}</span>
                          </div>
                          <div className="account-detail">
                            <span className="detail-label">Branch</span>
                            <span className="detail-value">{account.branch}</span>
                          </div>
                          <div className="account-detail">
                            <span className="detail-label">SWIFT</span>
                            <span className="detail-value">{account.swiftCode}</span>
                          </div>
                          <div className="account-detail">
                            <span className="detail-label">IBAN</span>
                            <span className="detail-value">{account.iban}</span>
                          </div>
                        </div>
                        <div className="account-card-footer">
                          <button className="select-account-btn">
                            <span>Select Account</span>
                            <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="payment-modal-footer">
            <button className="payment-modal-btn cancel" onClick={handleClose}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;