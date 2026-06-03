import React from 'react';
import cseApi from '../../services/cseApi';
import CSEAnnouncementFeed from './shared/CSEAnnouncementFeed';

const ALL_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
);

const RULE_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
);

const FEE_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const FILTER_TABS = [
    { id: 'all', label: 'All Circulars', icon: ALL_ICON },
    {
        id: 'rules',
        label: 'Rule Amendments',
        icon: RULE_ICON,
        matches: (item) => /rule|amendment/i.test(item?.title || '')
    },
    {
        id: 'fees',
        label: 'Fees / Charges',
        icon: FEE_ICON,
        matches: (item) => /fee|charge|tariff/i.test(item?.title || '')
    }
];

const TradingUpdates = () => (
    <CSEAnnouncementFeed
        title="Trading Updates"
        subtitle="CSE circulars on trading rules, fees, and operational changes."
        loader={cseApi.circularAnnouncements}
        filterTabs={FILTER_TABS}
        dropdownAxis="category"
        itemTypeLabel="Circular"
        emptyMessage="No trading circulars have been published recently."
    />
);

export default TradingUpdates;
