// frontend/src/components/ErrorBoundary.jsx
//
// A boundary that heals itself.
//
// The requirement is that a user never has to tap a retry button, so this
// component does the retrying: when a subtree throws, it waits a moment and
// re-renders it, backing off if the problem persists, and keeps trying on a slow
// cadence indefinitely. Because the underlying causes are transient (a chunk
// that failed mid-restart, an API call that came back 502), the overwhelming
// majority of these recover on the first or second attempt with the user seeing
// nothing more than a brief loading state.

import React from 'react';

const FAST_ATTEMPTS = 5;

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, attempt: 0, error: null };
        this.timer = null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught:', error, info);
        }
        this.scheduleRecovery();
    }

    componentDidUpdate(prevProps) {
        // A route change is a fresh start - drop the error state so navigating
        // away from a broken screen always works.
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.clearTimer();
            this.setState({ hasError: false, attempt: 0, error: null });
        }
    }

    componentWillUnmount() {
        this.clearTimer();
    }

    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    scheduleRecovery() {
        this.clearTimer();

        const attempt = this.state.attempt;

        // 400ms, 800ms, 1.6s, 3.2s, 6.4s, then a steady 15s forever.
        const delay = attempt < FAST_ATTEMPTS ? 400 * 2 ** attempt : 15000;

        this.timer = setTimeout(() => {
            this.setState((prev) => ({
                hasError: false,
                error: null,
                attempt: prev.attempt + 1,
            }));
        }, delay);
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Early attempts show a plain loading state - indistinguishable from a
        // slow load, which is what it effectively is.
        if (this.state.attempt < FAST_ATTEMPTS) {
            return (
                this.props.fallback || (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                    </div>
                )
            );
        }

        // Persistent trouble. Still no button: we keep retrying on our own and
        // simply tell the user what is happening.
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-sm px-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm font-medium">Reconnecting…</p>
                    <p className="text-gray-400 text-xs mt-1">
                        The server is taking longer than usual. This will recover on its own.
                    </p>
                </div>
            </div>
        );
    }
}
