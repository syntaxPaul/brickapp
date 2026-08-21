// frontend/src/hooks/useQuery.js
//
// Data fetching that paints instantly.
//
// The old pattern on every page was: loading=true -> spinner -> await -> render.
// That means a blocking spinner on every single visit, even to a screen whose
// data has not changed since thirty seconds ago.
//
// useQuery instead returns cached data synchronously on the first render, so the
// screen is already there, and refreshes underneath. `isLoading` is true only
// when there is genuinely nothing to show yet.

import { useCallback, useEffect, useRef, useState } from 'react';
import { readCache, writeCache } from '../lib/cache';
import { getJSON, isTransient } from '../lib/http';

/**
 * @param {string|null} key       cache key; pass null to disable the query
 * @param {() => Promise<any>} fetcher
 * @param {object} options
 * @param {any}    options.initialData  value to use before anything is cached
 * @param {number} options.refreshMs    optional background refresh interval
 */
export function useQuery(key, fetcher, options = {}) {
    const { initialData = undefined, refreshMs = 0, enabled = true } = options;

    const cached = key && enabled ? readCache(key) : null;

    const [data, setData] = useState(cached ? cached.data : initialData);
    const [isLoading, setIsLoading] = useState(!cached && enabled);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const mounted = useRef(true);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const run = useCallback(
        async ({ background = false } = {}) => {
            if (!key || !enabled) return;

            if (background) setIsRefreshing(true);

            try {
                const result = await fetcherRef.current();
                if (!mounted.current) return;
                setData(result);
                setError(null);
                writeCache(key, result);
            } catch (err) {
                if (!mounted.current) return;

                // If we have something cached, a transient failure is not worth
                // surfacing at all - the user keeps looking at their data and
                // the next refresh will quietly succeed.
                const haveData = readCache(key) !== null;
                if (!(haveData && isTransient(err))) {
                    setError(err);
                }
            } finally {
                if (mounted.current) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        },
        [key, enabled]
    );

    useEffect(() => {
        run({ background: Boolean(cached) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, enabled]);

    // Refresh when the tab regains focus - coming back to a stale tab should
    // show current numbers without a manual reload.
    useEffect(() => {
        if (!key || !enabled) return undefined;

        const onFocus = () => {
            if (document.visibilityState === 'visible') run({ background: true });
        };
        document.addEventListener('visibilitychange', onFocus);
        window.addEventListener('online', onFocus);
        return () => {
            document.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('online', onFocus);
        };
    }, [key, enabled, run]);

    useEffect(() => {
        if (!refreshMs || !key || !enabled) return undefined;
        const id = setInterval(() => run({ background: true }), refreshMs);
        return () => clearInterval(id);
    }, [refreshMs, key, enabled, run]);

    return {
        data,
        isLoading,
        isRefreshing,
        error,
        refresh: () => run({ background: true }),
        setData,
    };
}

/** Convenience wrapper for a plain GET endpoint. */
export function useApi(url, options = {}) {
    return useQuery(url, () => getJSON(url), options);
}
