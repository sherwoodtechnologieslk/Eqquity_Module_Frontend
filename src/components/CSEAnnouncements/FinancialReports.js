import React from 'react';
import cseApi from '../../services/cseApi';
import CSEAnnouncementFeed from './shared/CSEAnnouncementFeed';

const FILTER_TABS = [
    {
        id: 'all',
        label: 'All Filings',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        )
    },
    {
        id: 'annual',
        label: 'Annual Reports',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
        ),
        matches: (item) => /annual/i.test(item?.title || '')
    },
    {
        id: 'interim',
        label: 'Interim / Quarterly',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-6" />
            </svg>
        ),
        matches: (item) => /interim|quarter/i.test(item?.title || '')
    },
    {
        id: 'other',
        label: 'Other',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
        ),
        matches: (item) => !/annual|interim|quarter/i.test(item?.title || '')
    }
];

const FinancialReports = () => (
    <CSEAnnouncementFeed
        title="Financial Reports"
        subtitle="Live company filings published on the Colombo Stock Exchange."
        loader={cseApi.financialAnnouncements}
        filterTabs={FILTER_TABS}
        dropdownAxis="company"
        itemTypeLabel="Financial"
        emptyMessage="No financial filings have been published recently."
    />
);

export default FinancialReports;
