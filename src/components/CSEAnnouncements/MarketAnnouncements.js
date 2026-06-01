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

const NEW_LISTING_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);

const BUY_IN_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);

const FILTER_TABS = [
    { id: 'all', label: 'All Announcements', icon: ALL_ICON },
    {
        id: 'new-listings',
        label: 'New Listings',
        icon: NEW_LISTING_ICON,
        matches: (item) => item?.type === 'New Listing'
    },
    {
        id: 'buy-in',
        label: 'Buy-In Board',
        icon: BUY_IN_ICON,
        matches: (item) => item?.type === 'Buy-In Board'
    }
];

const MarketAnnouncements = () => (
    <CSEAnnouncementFeed
        title="Market Announcements"
        subtitle="Live new-listing notices and buy-in board disclosures from CSE."
        loader={cseApi.marketAnnouncements}
        filterTabs={FILTER_TABS}
        dropdownAxis="company"
        emptyMessage="No market announcements have been published recently."
    />
);

export default MarketAnnouncements;
