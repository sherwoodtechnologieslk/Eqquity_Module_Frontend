import React, { useState, useEffect } from 'react';
import { accountAPI } from '../../services/api';
import './Styles/AccountListView.css';

const AccountListView = () => {
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
                <th>Owner</th>
                <th>Method Code</th>
                <th>Settlement Accounts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td>{account.payment_method}</td>
                  <td>{account.owner}</td>
                  <td>{account.method_code}</td>
                  <td>{account.settlement_accounts}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="acct-delete-btn"
                    >
                      Delete
                    </button>
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