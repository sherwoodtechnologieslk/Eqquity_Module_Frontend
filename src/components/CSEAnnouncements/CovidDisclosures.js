import React from 'react';
import cseApi from '../../services/cseApi';
import CSEAnnouncementFeed from './shared/CSEAnnouncementFeed';

// COVID items lack a ticker symbol — use company name so the company filter works.
const loadCovidAnnouncements = async () => {
    const res = await cseApi.covidAnnouncements();
    const items = (Array.isArray(res?.items) ? res.items : []).map((item) => ({
        ...item,
        symbol: item.symbol || item.company || ''
    }));
    return { ...res, items };
};

const CovidDisclosures = () => (
    <CSEAnnouncementFeed
        title="COVID-19 Disclosures"
        subtitle="Archived COVID-19 disclosure notices published on the Colombo Stock Exchange."
        loader={loadCovidAnnouncements}
        dropdownAxis="company"
        itemTypeLabel="COVID-19"
        emptyMessage="No COVID-19 disclosures are available."
    />
);

export default CovidDisclosures;
