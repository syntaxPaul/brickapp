//frontend/src/App.jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ChatWidget from './components/Chat/ChatWidget';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Wastage = lazy(() => import('./pages/Wastage'));
const Production = lazy(() => import('./pages/Production'));
const Deliveries = lazy(() => import('./pages/Deliveries'));
const Users = lazy(() => import('./pages/Users'));

function PageLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
    );
}

function AppContent() {
    const { user, loading } = useAuth();

    console.log('🔍 AppContent - user:', user, 'loading:', loading);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading BrickApp...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <ChatProvider>
            <div className="relative">
                <Suspense fallback={<PageLoading />}>
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
                {/* ChatWidget is now always rendered but controlled internally */}
                <ChatWidget />
            </div>
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
                    success: {
                        icon: '✅',
                    },
                    error: {
                        icon: '❌',
                    },
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