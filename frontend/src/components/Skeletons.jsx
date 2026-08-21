// frontend/src/components/Skeletons.jsx
//
// Placeholders shaped like the content that is about to arrive.
//
// A centred spinner tells the user "wait"; a skeleton tells them "this is
// already loading, and here is what it will look like". Because the shapes match
// the real layout, nothing jumps when the data lands.

import React from 'react';

const shimmer = 'animate-pulse bg-gray-200/70 rounded';

export function SkeletonLine({ className = '' }) {
    return <div className={`${shimmer} h-4 ${className}`} />;
}

export function SkeletonStatCards({ count = 4 }) {
    return (
        <div className="grid-stats">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-3">
                            <SkeletonLine className="w-24" />
                            <SkeletonLine className="h-7 w-32" />
                            <SkeletonLine className="h-3 w-28" />
                        </div>
                        <div className={`${shimmer} w-11 h-11 rounded-xl`} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonChartCard({ title = '', height = 220 }) {
    return (
        <div className="card">
            <div className="card-header">
                <SkeletonLine className="w-40" />
                <SkeletonLine className="h-3 w-20" />
            </div>
            <div className="card-body">
                <div className={`${shimmer}`} style={{ height }} />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {Array.from({ length: cols }).map((_, i) => (
                            <th key={i}>
                                <SkeletonLine className="w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, r) => (
                        <tr key={r}>
                            {Array.from({ length: cols }).map((_, c) => (
                                <td key={c}>
                                    <SkeletonLine className={c === 0 ? 'w-12' : 'w-24'} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Route-level placeholder. Shown while a page chunk is still downloading, so a
 * navigation looks like the page arriving rather than the app stalling.
 */
export function SkeletonPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                    <SkeletonLine className="h-6 w-40" />
                    <SkeletonLine className="h-3 w-64" />
                </div>
                <div className="flex gap-3">
                    <div className={`${shimmer} h-9 w-28 rounded-lg`} />
                    <div className={`${shimmer} h-9 w-32 rounded-lg`} />
                </div>
            </div>
            <SkeletonStatCards />
            <div className="card mt-6">
                <div className="card-header">
                    <SkeletonLine className="w-32" />
                </div>
                <div className="card-body p-0">
                    <SkeletonTable />
                </div>
            </div>
        </div>
    );
}

/**
 * A quiet indicator that we are running on cached data while the server comes
 * back. Deliberately unobtrusive - it is information, not an alarm, and there is
 * nothing for the user to do about it.
 */
export function ReconnectingBadge({ show }) {
    if (!show) return null;
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-800/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Reconnecting — showing saved data
        </div>
    );
}
