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

const DIVIDEND_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
    </svg>
);

const RIGHTS_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H4v8h16v-2" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

const MEETING_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const OTHER_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
);

const FILTER_TABS = [
    { id: 'all', label: 'All Notices', icon: ALL_ICON },
    {
        id: 'dividend',
        label: 'Dividends',
        icon: DIVIDEND_ICON,
        matches: (item) => /dividend/i.test(`${item?.category || ''} ${item?.title || ''}`)
    },
    {
        id: 'rights',
        label: 'Rights / Splits',
        icon: RIGHTS_ICON,
        matches: (item) => /rights|split|scrip|bonus/i.test(`${item?.category || ''} ${item?.title || ''}`)
    },
    {
        id: 'meetings',
        label: 'AGM / Meetings',
        icon: MEETING_ICON,
        matches: (item) => /agm|meeting/i.test(`${item?.category || ''} ${item?.title || ''}`)
    },
    {
        id: 'other',
        label: 'Other',
        icon: OTHER_ICON,
        matches: (item) => {
            const text = `${item?.category || ''} ${item?.title || ''}`;
            return !/dividend|rights|split|scrip|bonus|agm|meeting/i.test(text);
        }
    }
];

const CorporateNotices = () => (
    <CSEAnnouncementFeed
        title="Corporate Notices"
        subtitle="Approved corporate actions and announcements from CSE-listed companies."
        loader={cseApi.approvedAnnouncements}
        filterTabs={FILTER_TABS}
        dropdownAxis="company"
        emptyMessage="No corporate notices have been published recently."
    />
);

export default CorporateNotices;
