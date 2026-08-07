import React from 'react';
import cseApi from '../../services/cseApi';
import CSEAnnouncementFeed from './shared/CSEAnnouncementFeed';

const FILTER_TABS = [
    { id: 'all', label: 'All Announcements' },
    {
        id: 'new-listings',
        label: 'New Listings',
        matches: (item) => item?.type === 'New Listing'
    },
    {
        id: 'buy-in',
        label: 'Buy-In Board',
        matches: (item) => item?.type === 'Buy-In Board'
    }
];

const MarketAnnouncements = () => (
    <CSEAnnouncementFeed
        eyebrow="CSE Announcements"
        title="Market Announcements"
        subtitle="Live new-listing notices and buy-in board disclosures from CSE."
        loader={cseApi.marketAnnouncements}
        filterTabs={FILTER_TABS}
        dropdownAxis="company"
        emptyMessage="No market announcements have been published recently."
    />
);

export default MarketAnnouncements;
