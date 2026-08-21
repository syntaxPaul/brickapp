//frontend/src/App.jsx
import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonPage, ReconnectingBadge } from './components/Skeletons';
import { lazyWithRetry } from './lib/lazyWithRetry';
import { prefetchAllWhenIdle } from './lib/prefetch';
import { routeImporters } from './routes';

// Chat is not needed to render the first screen, and it drags socket.io along
// with it. Deferring it keeps the realtime client off the critical path; it
// mounts a moment later once the app is interactive.
const ChatWidget = lazyWithRetry(() => import('./components/Chat/ChatWidget'));

// Login is the only eager consumer of framer-motion. Signed-in users never
// render it, so loading it lazily takes ~100 KB off their critical path. For
// signed-out visitors we kick the import off immediately (see AppContent), so
// there is no added wait.
const Login = lazyWithRetry(() => import('./pages/Login'));

// Every route goes through lazyWithRetry: a chunk that fails while the server is
// restarting retries itself instead of unmounting the app into a white screen.
const Dashboard = lazyWithRetry(routeImporters['/']);
const Products = lazyWithRetry(routeImporters['/products']);
const Orders = lazyWithRetry(routeImporters['/orders']);
const Suppliers = lazyWithRetry(routeImporters['/suppliers']);
const Expenses = lazyWithRetry(routeImporters['/expenses']);
const Wastage = lazyWithRetry(routeImporters['/wastage']);
const Production = lazyWithRetry(routeImporters['/production']);
const Deliveries = lazyWithRetry(routeImporters['/deliveries']);
const Users = lazyWithRetry(routeImporters['/users']);

function AppRoutes() {
    const location = useLocation();

    // Once the current page has painted, quietly pull the other routes in during
    // idle time so later navigations have nothing left to download.
    useEffect(() => {
        prefetchAllWhenIdle(location.pathname);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ErrorBoundary resetKey={location.pathname} fallback={<SkeletonPage />}>
            <Suspense fallback={<SkeletonPage />}>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="products" element={<Products />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="wastage" element={<Wastage />} />
                        <Route path="production" element={<Production />} />
                        <Route path="deliveries" element={<Deliveries />} />
                        <Route path="users" element={<Users />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
}

function AppContent() {
    const { user, loading, degraded } = useAuth();

    // This only appears on a genuinely first-ever load. Returning users are
    // restored from the cached session and go straight to their screen.
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading BrickApp…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Suspense fallback={null}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        );
    }

    return (
        <ChatProvider>
            <div className="relative">
                <AppRoutes />
                <Suspense fallback={null}>
                    <ChatWidget />
                </Suspense>
            </div>
            <ReconnectingBadge show={degraded} />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1e293b',
                        color: '#f1f5f9',
                        borderRadius: '12px',
                        padding: '12px 20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    },
                    success: { icon: '✅' },
                    error: { icon: '❌' },
                }}
            />
        </ChatProvider>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
