import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../../services/cseApi';
import { fmtCompact, fmtNum, fmtPct, pctClass } from './cseFormat';
import './DashboardCseExtras.css';

const REFRESH_MS = 4 * 60 * 1000;

// Live CSE sector index board (allSectors) — premium grid below Market Today.
const SectorIndicesCard = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [note, setNote] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await cseApi.sectorIndices();
            setItems(res.items || []);
            setNote(res.note || '');
        } catch (e) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(() => load(true), REFRESH_MS);
        return () => clearInterval(id);
    }, [load]);

    const sorted = useMemo(
        () =>
            [...items].sort(
                (a, b) => Math.abs(Number(b.percentage) || 0) - Math.abs(Number(a.percentage) || 0)
            ),
        [items]
    );

    const highlights = useMemo(() => {
        if (!items.length) return { gainer: null, loser: null, turnover: null };
        const gainers = items.filter((s) => (Number(s.percentage) || 0) > 0);
        const losers = items.filter((s) => (Number(s.percentage) || 0) < 0);
        const gainer = gainers.length
            ? gainers.reduce((best, s) =>
                  (Number(s.percentage) || 0) > (Number(best.percentage) || 0) ? s : best
              )
            : null;
        const loser = losers.length
            ? losers.reduce((worst, s) =>
                  (Number(s.percentage) || 0) < (Number(worst.percentage) || 0) ? s : worst
              )
            : null;
        const turnover = [...items].sort(
            (a, b) => (Number(b.turnover) || 0) - (Number(a.turnover) || 0)
        )[0];
        return { gainer, loser, turnover };
    }, [items]);

    const maxAbsPct = useMemo(() => {
        let max = 0;
        sorted.forEach((s) => {
            const m = Math.abs(Number(s.percentage) || 0);
            if (m > max) max = m;
        });
        return max || 1;
    }, [sorted]);

    const labelOf = (s) => s?.name || s?.symbol || '—';

    return (
        <div
            className="content-card cse-sector-indices"
            role="region"
            aria-label="Live CSE sector indices"
        >
            <div className="card-header cse-sector-indices__header">
                <div className="header-left cse-sector-indices__heading">
                    <span className="card-subtitle">Sector Indices</span>
                    <span className="cse-sector-indices__hint">
                        Live CSE sector index values
                        {items.length > 0 ? ` · ${items.length} sectors` : ''}
                    </span>
                </div>
                <span className="cse-sector-indices__badge">
                    <span className="cse-sector-indices__badge-dot" aria-hidden />
                    Live
                </span>
            </div>

            {loading && items.length === 0 ? (
                <div className="cse-sector-indices__state">Loading sector indices…</div>
            ) : items.length === 0 ? (
                <div className="cse-sector-indices__state">{note || 'No sector data available.'}</div>
            ) : (
                <>
                    <div className="cse-sector-indices__spotlights">
                        <div className="cse-sector-spot cse-sector-spot--up">
                            <span className="cse-sector-spot__tag">Top gainer</span>
                            {highlights.gainer ? (
                                <>
                                    <span className="cse-sector-spot__name" title={labelOf(highlights.gainer)}>
                                        {labelOf(highlights.gainer)}
                                    </span>
                                    <span className="cse-sector-spot__value">
                                        {fmtNum(highlights.gainer.value, 2)}
                                    </span>
                                    <span className="cse-sector-spot__chg cse-up">
                                        {fmtPct(highlights.gainer.percentage)}
                                    </span>
                                </>
                            ) : (
                                <span className="cse-sector-spot__empty">No gainers today</span>
                            )}
                        </div>
                        <div className="cse-sector-spot cse-sector-spot--down">
                            <span className="cse-sector-spot__tag">Top loser</span>
                            {highlights.loser ? (
                                <>
                                    <span className="cse-sector-spot__name" title={labelOf(highlights.loser)}>
                                        {labelOf(highlights.loser)}
                                    </span>
                                    <span className="cse-sector-spot__value">
                                        {fmtNum(highlights.loser.value, 2)}
                                    </span>
                                    <span className="cse-sector-spot__chg cse-down">
                                        {fmtPct(highlights.loser.percentage)}
                                    </span>
                                </>
                            ) : (
                                <span className="cse-sector-spot__empty">No losers today</span>
                            )}
                        </div>
                        <div className="cse-sector-spot cse-sector-spot--neutral">
                            <span className="cse-sector-spot__tag">Highest turnover</span>
                            {highlights.turnover ? (
                                <>
                                    <span className="cse-sector-spot__name" title={labelOf(highlights.turnover)}>
                                        {labelOf(highlights.turnover)}
                                    </span>
                                    <span className="cse-sector-spot__value cse-sector-spot__value--compact">
                                        LKR {fmtCompact(highlights.turnover.turnover)}
                                    </span>
                                    <span className="cse-sector-spot__sub">
                                        {fmtNum(highlights.turnover.value, 2)} index
                                    </span>
                                </>
                            ) : (
                                <span className="cse-sector-spot__empty">No turnover data</span>
                            )}
                        </div>
                    </div>

                    <div className="cse-sector-indices__panel-head" aria-hidden>
                        <span>Sector</span>
                        <span>Index</span>
                        <span>Change</span>
                    </div>

                    <div className="cse-sector-indices__grid">
                        {sorted.map((s) => {
                            const pct = Number(s.percentage) || 0;
                            const dir = pctClass(pct);
                            const barWidth = Math.max((Math.abs(pct) / maxAbsPct) * 100, 4);
                            return (
                                <article
                                    key={s.id}
                                    className={`cse-sector-tile cse-sector-tile--${dir}`}
                                >
                                    <div className="cse-sector-tile__top">
                                        <div className="cse-sector-tile__info">
                                            <span className="cse-sector-tile__name" title={s.name}>
                                                {s.name || s.symbol || '—'}
                                            </span>
                                            {s.indexName ? (
                                                <span className="cse-sector-tile__index" title={s.indexName}>
                                                    {s.indexName}
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className={`cse-sector-tile__chg cse-${dir}`}>
                                            {fmtPct(pct)}
                                        </span>
                                    </div>
                                    <div className="cse-sector-tile__value">{fmtNum(s.value, 2)}</div>
                                    <div className={`cse-sector-tile__bar cse-sector-tile__bar--${dir}`}>
                                        <span style={{ width: `${barWidth}%` }} />
                                    </div>
                                    {(s.turnover > 0 || s.volume > 0) && (
                                        <div className="cse-sector-tile__foot">
                                            {s.turnover > 0 && (
                                                <span>Turnover LKR {fmtCompact(s.turnover)}</span>
                                            )}
                                            {s.volume > 0 && (
                                                <span>Vol {fmtCompact(s.volume)}</span>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default SectorIndicesCard;
