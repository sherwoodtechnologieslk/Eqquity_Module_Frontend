import React, { useEffect, useState } from 'react';
import { chartOfAccountsAPI } from '../../services/api';
import InternalBankTransfer from './InternalBankTransfer';

const InternalBankTransferModule = () => {
  const [chartAccounts, setChartAccounts] = useState([]);
  const [chartAccountsLoading, setChartAccountsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setChartAccountsLoading(true);
        const data = await chartOfAccountsAPI.getAll();
        if (!cancelled) setChartAccounts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Chart of accounts load failed:', err);
        if (!cancelled) setChartAccounts([]);
      } finally {
        if (!cancelled) setChartAccountsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <InternalBankTransfer
      chartAccounts={chartAccounts}
      chartAccountsLoading={chartAccountsLoading}
    />
  );
};

export default InternalBankTransferModule;
