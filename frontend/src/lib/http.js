// frontend/src/lib/http.js
//
// Central HTTP behaviour for the whole app.
//
// The pages call bare `axios.get('/api/...')` in ~200 places, so rather than
// rewriting every call site we configure the GLOBAL axios instance here and
// import this module once from main.jsx. Every existing call immediately gains
// auth headers, silent retry, and outage handling.
//
// Design rules:
//   1. A transient server problem must never surface as an error the user has
//      to act on. Retry it.
//   2. A transient server problem must never be mistaken for an auth failure.
//      Only a real 401 with an auth error code logs anyone out.
//   3. Retries must not stampede. Exponential backoff with jitter.

import axios from 'axios';
import { emit } from './authEvents';

const DEV = import.meta.env.DEV;

// Status codes that mean "the server is momentarily unable", not "you did
// something wrong". These are exactly what Azure returns while a worker is
// cold-starting or recycling.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 400;
const MAX_DELAY_MS = 6000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function backoffDelay(attempt, retryAfterHeader) {
    // Honour Retry-After when the server sends one.
    if (retryAfterHeader) {
        const seconds = Number(retryAfterHeader);
        if (Number.isFinite(seconds) && seconds > 0) {
            return Math.min(seconds * 1000, MAX_DELAY_MS);
        }
    }
    const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
    // Full jitter: prevents every queued request retrying in lockstep and
    // hammering a server that is still coming up.
    return Math.random() * exponential;
}

function isRetryable(error) {
    const config = error.config;
    if (!config) return false;

    // Only retry idempotent verbs automatically. Replaying a POST could create
    // a duplicate order - never worth it.
    const method = (config.method || 'get').toLowerCase();
    if (!['get', 'head', 'options', 'put', 'delete'].includes(method)) return false;

    if (config.__noRetry) return false;

    // No response at all: network dropped, DNS failed, or the connection was
    // reset mid-restart. Retry.
    if (!error.response) {
        return error.code !== 'ERR_CANCELED' && error.code !== 'ECONNABORTED';
    }

    return RETRYABLE_STATUS.has(error.response.status);
}

let offlineNotified = false;

export function configureHttp() {
    axios.defaults.timeout = 30000;

    // -- request ------------------------------------------------------------
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            const branchId = localStorage.getItem('currentBranch');
            if (branchId) {
                config.headers['x-branch-id'] = branchId;
            }
            if (DEV) {
                console.debug('→', (config.method || 'get').toUpperCase(), config.url);
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // -- response -----------------------------------------------------------
    axios.interceptors.response.use(
        (response) => {
            if (offlineNotified) {
                offlineNotified = false;
                emit('online');
            }
            return response;
        },
        async (error) => {
            const config = error.config || {};
            const status = error.response?.status;

            // A genuine authentication failure. The server now sends an explicit
            // code so we can tell "your token is bad" apart from "the database
            // is briefly unreachable" - the old code treated both as logout.
            const authCode = error.response?.data?.code;
            const isRealAuthFailure =
                status === 401 &&
                ['NO_TOKEN', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'USER_NOT_FOUND'].includes(authCode);

            // Older server builds returned a bare 401/403 with no code. Treat a
            // bare 401 as an auth failure, but never a 403 or a 503.
            const legacyAuthFailure = status === 401 && !authCode;

            if (isRealAuthFailure || legacyAuthFailure) {
                emit('unauthorized', { code: authCode || 'UNKNOWN' });
                return Promise.reject(error);
            }

            if (isRetryable(error)) {
                config.__retryCount = (config.__retryCount || 0) + 1;

                if (config.__retryCount <= MAX_RETRIES) {
                    const delay = backoffDelay(
                        config.__retryCount - 1,
                        error.response?.headers?.['retry-after']
                    );

                    // Tell the UI we are in a degraded window so it can show a
                    // quiet "reconnecting" hint instead of an error.
                    if (config.__retryCount >= 2 && !offlineNotified) {
                        offlineNotified = true;
                        emit('offline', { status: status || 'network' });
                    }

                    if (DEV) {
                        console.debug(
                            `↻ retry ${config.__retryCount}/${MAX_RETRIES} in ${Math.round(delay)}ms`,
                            config.url
                        );
                    }

                    await sleep(delay);
                    return axios(config);
                }
            }

            return Promise.reject(error);
        }
    );
}

// ---------------------------------------------------------------------------
// Request coalescing
// ---------------------------------------------------------------------------
//
// Several screens request the same resource at the same moment (for example
// /api/products is fetched by both the Products page and the Orders form).
// Coalescing means the second caller joins the first request instead of opening
// another one - fewer round trips, and no duplicate work on the server.

const inFlight = new Map();

export function getJSON(url, options = {}) {
    const key = url;

    if (inFlight.has(key)) {
        return inFlight.get(key);
    }

    const promise = axios
        .get(url, options)
        .then((res) => res.data)
        .finally(() => {
            inFlight.delete(key);
        });

    inFlight.set(key, promise);
    return promise;
}

/** True when the error is a transient server/network condition, not a real failure. */
export function isTransient(error) {
    if (!error) return false;
    if (!error.response) return true;
    return RETRYABLE_STATUS.has(error.response.status);
}
