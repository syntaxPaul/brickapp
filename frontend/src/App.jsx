//frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ChatWidget from './components/Chat/ChatWidget';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Wastage from './pages/Wastage';
import Production from './pages/Production';
import Deliveries from './pages/Deliveries';
import Users from './pages/Users';

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