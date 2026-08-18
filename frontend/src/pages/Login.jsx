//frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, Loader2, User, Lock, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Please enter both username and password');
            return;
        }
        setIsLoading(true);
        const result = await login(username, password);
        setIsLoading(false);
        if (result.success) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/10"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Building2 size={32} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">BrickApp</h1>
                    <p className="text-gray-400 mt-1 text-sm">Multi-Branch Management System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Username
                        </label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition"
                                placeholder="Enter your username"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition"
                                placeholder="Enter your password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    <p className="font-medium text-gray-300 mb-3">Demo Credentials</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono bg-white/5 rounded-xl p-3">
                        <div className="flex justify-between text-gray-400">
                            <span className="text-blue-400">Owner:</span>
                            <span>owner1 / password123</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span className="text-green-400">POS:</span>
                            <span>pos_jhb / password123</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span className="text-yellow-400">Production:</span>
                            <span>prod_jhb / password123</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span className="text-purple-400">Delivery:</span>
                            <span>delivery_pta / password123</span>
                        </div>
                        <div className="flex justify-between text-gray-400 col-span-2">
                            <span className="text-red-400">Finance:</span>
                            <span>finance_cpt / password123</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}