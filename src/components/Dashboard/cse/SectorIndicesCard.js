import React, { useCallback, useEffect, useMemo, useState } from 'react';
import cseApi from '../../../services/cseApi';
import { fmtCompact, fmtNum, fmtPct, pctClass } from './cseFormat';
import './DashboardCseExtras.css';

const REFRESH_MS = 4 * 60 * 1000;

const dirLabel = { up: 'Gaining', down: 'Declining', flat: 'Unchanged' };

// Live CSE sector index board (allSectors) — institutional-grade panel below Market Today.
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

    const labelOf = (s) => s?.name || s?.symbol || '—';

    return (
        <div
            className="content-card cse-sector-indices"
            role="region"
            aria-label="Live CSE sector indices"
        >
            <header className="card-header cse-sector-indices__header">
                <div className="header-left cse-sector-indices__heading">
                    <h2>Sector indices</h2>
                    <span className="cse-sector-indices__hint">
                        Performance and market flow by CSE sector
                    </span>
                </div>
                <span className="cse-sector-indices__badge">
                    <span className="cse-sector-indices__badge-dot" aria-hidden />
                    Live CSE
                </span>
            </header>

            {loading && items.length === 0 ? (
                <div className="cse-sector-indices__state">
                    <span className="cse-sector-indices__state-pulse" aria-hidden />
                    Loading sector indices…
                </div>
            ) : items.length === 0 ? (
                <div className="cse-sector-indices__state">{note || 'No sector data available.'}</div>
            ) : (
                <div className="cse-sector-indices__body">
                    <div className="cse-sector-indices__kpis">
                        <article className="cse-sector-kpi cse-sector-kpi--up">
                            <div className="cse-sector-kpi__head">
                                <span className="cse-sector-kpi__label">Top Gainer</span>
                                <span className="cse-sector-kpi__glyph" aria-hidden>▲</span>
                            </div>
                            {highlights.gainer ? (
                                <>
                                    <span
                                        className="cse-sector-kpi__name"
                                        title={labelOf(highlights.gainer)}
                                    >
                                        {labelOf(highlights.gainer)}
                                    </span>
                                    <div className="cse-sector-kpi__metrics">
                                        <span className="cse-sector-kpi__value">
                                            {fmtNum(highlights.gainer.value, 2)}
                                        </span>
                                        <span className="cse-sector-kpi__chg cse-up">
                                            {fmtPct(highlights.gainer.percentage)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="cse-sector-kpi__empty">No gainers today</span>
                            )}
                        </article>

                        <article className="cse-sector-kpi cse-sector-kpi--down">
                            <div className="cse-sector-kpi__head">
                                <span className="cse-sector-kpi__label">Top Loser</span>
                                <span className="cse-sector-kpi__glyph" aria-hidden>▼</span>
                            </div>
                            {highlights.loser ? (
                                <>
                                    <span
                                        className="cse-sector-kpi__name"
                                        title={labelOf(highlights.loser)}
                                    >
                                        {labelOf(highlights.loser)}
                                    </span>
                                    <div className="cse-sector-kpi__metrics">
                                        <span className="cse-sector-kpi__value">
                                            {fmtNum(highlights.loser.value, 2)}
                                        </span>
                                        <span className="cse-sector-kpi__chg cse-down">
                                            {fmtPct(highlights.loser.percentage)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="cse-sector-kpi__empty">No losers today</span>
                            )}
                        </article>

                        <article className="cse-sector-kpi cse-sector-kpi--flow">
                            <div className="cse-sector-kpi__head">
                                <span className="cse-sector-kpi__label">Highest Turnover</span>
                                <span className="cse-sector-kpi__glyph cse-sector-kpi__glyph--flow" aria-hidden>◆</span>
                            </div>
                            {highlights.turnover ? (
                                <>
                                    <span
                                        className="cse-sector-kpi__name"
                                        title={labelOf(highlights.turnover)}
                                    >
                                        {labelOf(highlights.turnover)}
                                    </span>
                                    <div className="cse-sector-kpi__metrics">
                                        <span className="cse-sector-kpi__value cse-sector-kpi__value--compact">
                                            LKR {fmtCompact(highlights.turnover.turnover)}
                                        </span>
                                        <span className="cse-sector-kpi__sub">
                                            {fmtNum(highlights.turnover.value, 2)} index
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <span className="cse-sector-kpi__empty">No turnover data</span>
                            )}
                        </article>
                    </div>

                    <div className="cse-sector-indices__table-panel">
                        <div className="cse-sector-indices__list-head" role="row">
                            <span>Sector</span>
                            <span>Index</span>
                            <span>Change</span>
                            <span>Flow</span>
                        </div>

                        <div className="cse-sector-indices__list" role="table" aria-label="Sector index rankings">
                            {sorted.map((s, index) => {
                                const pct = Number(s.percentage) || 0;
                                const dir = pctClass(pct);
                                const fullLabel = s.indexName || s.name || s.symbol || '—';
                                return (
                                    <article
                                        key={s.id}
                                        className={`cse-sector-row cse-sector-row--${dir}${
                                            index % 2 === 1 ? ' cse-sector-row--alt' : ''
                                        }`}
                                        title={fullLabel}
                                        role="row"
                                    >
                                        <div className="cse-sector-row__sector" role="cell">
                                            <span
                                                className={`cse-sector-row__signal cse-sector-row__signal--${dir}`}
                                                title={dirLabel[dir] || 'Unchanged'}
                                                aria-label={dirLabel[dir] || 'Unchanged'}
                                            />
                                            <span className="cse-sector-row__name">
                                                {s.name || s.symbol || '—'}
                                            </span>
                                        </div>
                                        <div className="cse-sector-row__value" role="cell">
                                            {fmtNum(s.value, 2)}
                                        </div>
                                        <div
                                            className={`cse-sector-row__chg cse-${dir}`}
                                            role="cell"
                                        >
                                            {fmtPct(pct)}
                                        </div>
                                        <div className="cse-sector-row__flow" role="cell">
                                            {s.turnover > 0 ? (
                                                <span>LKR {fmtCompact(s.turnover)}</span>
                                            ) : (
                                                <span className="cse-sector-row__flow-empty">—</span>
                                            )}
                                            {s.volume > 0 ? (
                                                <span className="cse-sector-row__vol">
                                                    Vol {fmtCompact(s.volume)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectorIndicesCard;
