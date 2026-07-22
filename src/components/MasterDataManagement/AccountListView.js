import React, { useState, useEffect } from 'react';
import { accountAPI } from '../../services/api';
import './Styles/AccountListView.css';

const AccountListView = ({ onEditAccount }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await accountAPI.getAllAccounts();
      setAccounts(data);
    } catch (err) {
      setError('Failed to fetch accounts. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountAPI.deleteAccount(id);
        setAccounts(accounts.filter(account => account.id !== id));
      } catch (err) {
        alert('Failed to delete account');
        console.error('Error deleting account:', err);
      }
    }
  };

  if (loading) {
    return (
        <div className="acct-list-container">
            <div className="acct-loading">Loading accounts...</div>
        </div>
    );
  }

  return (
    <div className="acct-list-container">
      {error && <div className="acct-error-message">{error}</div>}

      {accounts.length === 0 ? (
        <div className="acct-empty-state">
          <p>No accounts found. Add your first account using the Account Master form.</p>
        </div>
      ) : (
        <div className="acct-table-container">
          <table className="acct-list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Payment Method</th>
                <th>Account Name</th>
                <th>Account Number</th>
                <th>Bank Name</th>
                <th>Branch Name</th>
                <th>SWIFT Code</th>
                <th>IBAN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>{account.payment_method}</td>
                  <td>{account.account_name}</td>
                  <td>{account.account_number}</td>
                  <td>{account.bank_name}</td>
                  <td>{account.branch_name}</td>
                  <td>{account.swift_code || ''}</td>
                  <td>{account.iban || ''}</td>
                  <td>
                    <div className="acct-action-buttons">
                      <button
                        onClick={() => onEditAccount(account.id)}
                        className="acct-edit-btn"
                        title="Edit Account"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="acct-delete-btn"
                        title="Delete Account"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountListView; 