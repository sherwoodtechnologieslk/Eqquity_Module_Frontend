import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const buildHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

/**
 * Polls /api/agents/me on an interval and exposes the current Agent Blux
 * state for the logged-in user. On network/API failures, the local status is
 * forced to "offline" so the UI degrades gracefully without losing the name.
 *
 * Also returns a `patchStatus` helper that callers (e.g. the dashboard) can
 * use to push a freshly-computed sentiment to the backend.
 */
export function useAgentStatus({ pollMs = 4000, enabled = true } = {}) {
    const [data, setData] = useState({
        name: 'Agent Blux',
        status: 'idle',
        last_signal_summary: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isMountedRef = useRef(true);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/agents/me`, {
                method: 'GET',
                headers: buildHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = await response.json();
            if (!isMountedRef.current) return;
            setData((prev) => ({
                name: json.name || prev.name || 'Agent Blux',
                status: json.status || 'idle',
                last_signal_summary: json.last_signal_summary ?? null
            }));
            setError(null);
        } catch (err) {
            if (!isMountedRef.current) return;
            setError(err.message || 'Failed to fetch agent status');
            setData((prev) => ({ ...prev, status: 'offline' }));
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    }, []);

    const patchStatus = useCallback(async (nextStatus, summary) => {
        if (!nextStatus) return null;
        try {
            const response = await fetch(`${API_BASE_URL}/agents/me/status`, {
                method: 'PATCH',
                headers: buildHeaders(),
                body: JSON.stringify({ status: nextStatus, summary: summary || null })
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = await response.json();
            if (!isMountedRef.current) return json;
            setData((prev) => ({
                ...prev,
                status: json.status || nextStatus,
                last_signal_summary: json.last_signal_summary ?? summary ?? prev.last_signal_summary
            }));
            return json;
        } catch (err) {
            // Network/API issue — surface error but keep UI stable.
            if (isMountedRef.current) setError(err.message || 'Failed to update agent status');
            return null;
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        if (!enabled) {
            setLoading(false);
            return () => {
                isMountedRef.current = false;
            };
        }
        fetchStatus();
        const interval = setInterval(fetchStatus, pollMs);
        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
        };
    }, [enabled, fetchStatus, pollMs]);

    return {
        ...data,
        loading,
        error,
        refresh: fetchStatus,
        patchStatus
    };
}

export default useAgentStatus;
