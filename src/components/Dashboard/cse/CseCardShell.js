import React from 'react';
import { fmtTime } from './cseFormat';
import './DashboardCseExtras.css';

const RefreshIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </svg>
);

// Shared card wrapper for the live CSE dashboard widgets.
const CseCardShell = ({
    title,
    subtitle,
    lastUpdated,
    onRefresh,
    refreshing,
    children,
    className = ''
}) => (
    <div className={`content-card cse-card ${className}`}>
        <div className="cse-card__head">
            <div>
                <h3 className="cse-card__title">{title}</h3>
                <span className="cse-card__sub">
                    {subtitle}
                    {lastUpdated ? ` · ${fmtTime(lastUpdated)}` : ''}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="cse-card__live">
                    <span className="cse-card__live-dot" />
                    Live CSE
                </span>
                {onRefresh && (
                    <button
                        type="button"
                        className="cse-refresh"
                        onClick={onRefresh}
                        disabled={refreshing}
                        aria-label={`Refresh ${title}`}
                        title="Refresh"
                    >
                        <RefreshIcon />
                    </button>
                )}
            </div>
        </div>
        {children}
    </div>
);

export default CseCardShell;
