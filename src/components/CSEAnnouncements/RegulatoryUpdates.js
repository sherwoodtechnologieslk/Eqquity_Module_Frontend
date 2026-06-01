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

const DIRECTIVE_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const NONCOMPL_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const FILTER_TABS = [
    { id: 'all', label: 'All Updates', icon: ALL_ICON },
    {
        id: 'directives',
        label: 'Directives',
        icon: DIRECTIVE_ICON,
        matches: (item) => item?.type === 'Directive'
    },
    {
        id: 'non-compliance',
        label: 'Non-Compliance',
        icon: NONCOMPL_ICON,
        matches: (item) => item?.type === 'Non-Compliance'
    }
];

const RegulatoryUpdates = () => (
    <CSEAnnouncementFeed
        title="Regulatory Updates"
        subtitle="SEC directives and non-compliance disclosures issued by CSE."
        loader={cseApi.regulatoryUpdates}
        filterTabs={FILTER_TABS}
        dropdownAxis="company"
        emptyMessage="No regulatory updates have been published recently."
    />
);

export default RegulatoryUpdates;
