import { useEffect, useRef, useState } from 'react';
import cseApi from '../services/cseApi';
import { deriveBluxSignal } from '../components/AgentBlux/bluxSignal';

const REFRESH_MS = 3 * 60 * 1000;

/**
 * Watches CSE movers + the user's holdings, computes a Blux sentiment
 * signal, pushes it to the backend via `patchStatus` whenever it changes,
 * and also returns the latest signal to the caller so the UI can display
 * the comparison without waiting on the GET poll.
 *
 * @param {Object}   params
 * @param {string[]} params.holdingSymbols   Symbols the user currently owns.
 * @param {Function} params.patchStatus      `(status, summary) => Promise` — from useAgentStatus.
 * @param {boolean}  params.enabled          Skip work until the dashboard has data.
 */
export function useBluxSignal({ holdingSymbols, patchStatus, enabled = true }) {
    const lastPushedRef = useRef({ status: null, summary: null });
    const holdingSymbolsRef = useRef(holdingSymbols || []);
    const [signal, setSignal] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        holdingSymbolsRef.current = holdingSymbols || [];
    }, [holdingSymbols]);

    useEffect(() => {
        if (!enabled) return undefined;

        let cancelled = false;

        const compute = async () => {
            try {
                const result = await cseApi.dashboardMovers();
                if (cancelled) return;
                const next = deriveBluxSignal({
                    holdingSymbols: holdingSymbolsRef.current,
                    feeds: {
                        gainers: result.gainers,
                        losers: result.losers,
                        active: result.active
                    },
                    marketStatus: result.marketStatus
                });
                if (!next || !next.status) return;

                setSignal(next);
                setLastUpdated(result.lastUpdated || new Date().toISOString());

                if (typeof patchStatus === 'function') {
                    const last = lastPushedRef.current;
                    if (last.status !== next.status || last.summary !== next.summary) {
                        lastPushedRef.current = { status: next.status, summary: next.summary };
                        patchStatus(next.status, next.summary);
                    }
                }
            } catch (err) {
                if (cancelled) return;
                const offline = {
                    status: 'offline',
                    summary: 'Could not reach CSE market feed',
                    verdict: 'Offline',
                    metrics: null
                };
                setSignal(offline);
                setLastUpdated(new Date().toISOString());

                if (typeof patchStatus === 'function') {
                    const last = lastPushedRef.current;
                    if (last.status !== offline.status || last.summary !== offline.summary) {
                        lastPushedRef.current = { status: offline.status, summary: offline.summary };
                        patchStatus(offline.status, offline.summary);
                    }
                }
            }
        };

        compute();
        const interval = setInterval(compute, REFRESH_MS);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [enabled, patchStatus]);

    return { signal, lastUpdated };
}

export default useBluxSignal;
