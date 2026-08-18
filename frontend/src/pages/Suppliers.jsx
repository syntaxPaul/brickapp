import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clipboard, Plus, Edit, Trash2, Phone, Mail, MapPin,
    User, Loader2, X, BarChart3, PieChart, LineChart,
    Download, Printer, RefreshCw, Filter, Search,
    Building2, Award, Crown, Medal, TrendingUp, TrendingDown,
    DollarSign, Package, Clock, CheckCircle, AlertCircle,
    FileText, ChevronDown, ChevronUp, Users, Calendar,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, 
    PieChart as RePieChart, Pie, Cell,
    LineChart as ReLineChart, Line,
    ComposedChart
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f472b6', '#22d3ee'];

// =====================================================
// ANIMATION VARIANTS
// =====================================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12
        }
    }
};

const statsCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            type: "spring",
            stiffness: 100,
            damping: 12
        }
    }),
    hover: {
        y: -4,
        boxShadow: "0 12px 20px -8px rgba(0, 0, 0, 0.15)",
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 25
        }
    }
};

// =====================================================
// SUPPLIER METRICS COMPONENT
// =====================================================
const SupplierMetrics = ({ data, expenses }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No supplier data available</p>
                <p className="text-xs">Add a supplier to see metrics</p>
            </div>
        );
    }

    const totalSuppliers = data.length;
    const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const avgExpense = totalSuppliers > 0 ? totalExpense / totalSuppliers : 0;
    const topSupplier = data.reduce((max, s) => {
        const sExpense = expenses.filter(e => e.supplier_id === s.id).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        return sExpense > max.expense ? { name: s.name, expense: sExpense } : max;
    }, { name: 'N/A', expense: 0 });

    const metrics = [
        { 
            label: 'Total Suppliers', 
            value: totalSuppliers, 
            icon: <Building2 className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        { 
            label: 'Total Spend', 
            value: `R${totalExpense.toFixed(2)}`, 
            icon: <DollarSign className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        { 
            label: 'Avg per Supplier', 
            value: `R${avgExpense.toFixed(2)}`, 
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        { 
            label: 'Top Supplier', 
            value: topSupplier.name, 
            icon: <Crown className="h-5 w-5" />,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
                <motion.div
                    key={index}
                    custom={index}
                    variants={statsCardVariants}
                    whileHover="hover"
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg ${metric.bgColor} p-2`}>
                            <span className={metric.iconColor}>{metric.icon}</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{metric.label}</p>
                            <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// =====================================================
// MAIN SUPPLIERS COMPONENT
// =====================================================
export default function Suppliers() {
    // =====================================================
    // STATE
    // =====================================================
    const [suppliers, setSuppliers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    // Report State
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [reportData, setReportData] = useState({
        spendingData: [],
        supplierPerformance: [],
        categoryBreakdown: [],
        summary: {
            totalSuppliers: 0,
            totalSpend: 0,
            avgSpend: 0,
            topSupplier: '',
            topSpend: 0
        }
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: ''
    });

    // =====================================================
    // EFFECTS
    // =====================================================
    useEffect(() => {
        fetchData();
        generateReportData('monthly');
    }, []);

    // =====================================================
    // API CALLS
    // =====================================================
    const fetchData = async () => {
        try {
            const [suppliersRes, expensesRes] = await Promise.all([
                axios.get('/api/suppliers'),
                axios.get('/api/expenses')
            ]);
            setSuppliers(suppliersRes.data);
            setExpenses(expensesRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        setTableRefreshKey(prev => prev + 1);
        fetchData();
        generateReportData(reportPeriod);
    };

   // =====================================================
    // REPORT DATA GENERATION
    // =====================================================
    const generateReportData = (period) => {
        setReportLoading(true);

        const now = new Date();
        let count = 0;

        switch(period) {
            case 'daily': count = 30; break;
            case 'weekly': count = 12; break;
            case 'monthly': count = 12; break;
            default: count = 12;
        }

        // Generate spending data
        const spendingData = Array.from({ length: count }, (_, i) => {
            const date = new Date(now);
            if (period === 'daily') date.setDate(date.getDate() - (count - 1 - i));
            else if (period === 'weekly') date.setDate(date.getDate() - (count - 1 - i) * 7);
            else if (period === 'monthly') date.setMonth(date.getMonth() - (count - 1 - i));
            
            const dayExpenses = expenses.filter(e => {
                const expDate = new Date(e.expense_date);
                return expDate.toDateString() === date.toDateString();
            });

            const total = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            const expenseCount = dayExpenses.length;

            return {
                label: date.toLocaleDateString('en-ZA', { 
                    month: 'short', 
                    day: period === 'daily' || period === 'weekly' ? 'numeric' : undefined,
                    year: period === 'monthly' ? 'numeric' : undefined
                }),
                amount: Math.round(total * 100) / 100,
                count: expenseCount,
                date
            };
        });

        // Supplier performance
        const supplierPerformance = suppliers.map(supplier => {
            const supplierExpenses = expenses.filter(e => e.supplier_id === supplier.id);
            const total = supplierExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            const expenseCount = supplierExpenses.length;
            const avg = expenseCount > 0 ? total / expenseCount : 0;
            
            return {
                name: supplier.name,
                total,
                count: expenseCount,
                avg,
                contact: supplier.contact_person,
                phone: supplier.phone,
                email: supplier.email
            };
        }).sort((a, b) => b.total - a.total);

        // Category breakdown (using expense categories)
        const categoryMap = {};
        expenses.forEach(e => {
            const cat = e.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.amount || 0);
        });
        const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100
        })).sort((a, b) => b.value - a.value);

        // Summary stats
        const totalSpend = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const topSupplier = supplierPerformance.length > 0 ? supplierPerformance[0] : null;

        setReportData({
            spendingData,
            supplierPerformance,
            categoryBreakdown,
            summary: {
                totalSuppliers: suppliers.length,
                totalSpend: Math.round(totalSpend * 100) / 100,
                avgSpend: suppliers.length > 0 ? Math.round(totalSpend / suppliers.length * 100) / 100 : 0,
                topSupplier: topSupplier ? topSupplier.name : 'N/A',
                topSpend: topSupplier ? topSupplier.total : 0
            }
        });
        setReportLoading(false);
    };

    // =====================================================
    // CRUD OPERATIONS
    // =====================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await axios.put(`/api/suppliers/${editingSupplier.id}`, formData);
                toast.success('Supplier updated successfully');
            } else {
                await axios.post('/api/suppliers', formData);
                toast.success('Supplier created successfully');
            }
            setShowModal(false);
            setEditingSupplier(null);
            setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save supplier');
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await axios.delete(`/api/suppliers/${id}`);
            toast.success('Supplier deleted successfully');
            refreshData();
        } catch (error) {
            toast.error('Failed to delete supplier');
        }
    };

    const handleReportPeriodChange = (period) => {
        setReportPeriod(period);
        generateReportData(period);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const getSupplierSpend = (supplierId) => {
        return expenses
            .filter(e => e.supplier_id === supplierId)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    };

    const getSupplierExpenseCount = (supplierId) => {
        return expenses.filter(e => e.supplier_id === supplierId).length;
    };

    const filteredSuppliers = suppliers.filter(supplier => {
        const search = searchQuery.toLowerCase();
        return supplier.name?.toLowerCase().includes(search) ||
               supplier.contact_person?.toLowerCase().includes(search) ||
               supplier.email?.toLowerCase().includes(search) ||
               supplier.phone?.includes(search);
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    const tabs = [
        { id: 'list', label: 'Suppliers', icon: <Building2 size={16} /> },
        { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 size={16} /> },
        { id: 'insights', label: 'Insights', icon: <TrendingUp size={16} /> }
    ];

    const periodOptions = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'monthly', label: 'Monthly' }
    ];

    if (loading) {
        return (
            <div className="flex justify-center h-64 items-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    // =====================================================
    // RENDER: SUPPLIERS LIST TAB
    // =====================================================
    const renderSuppliersList = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Supplier Metrics */}
            <SupplierMetrics data={suppliers} expenses={expenses} />

            {/* Filters */}
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="relative flex-1 max-w-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Search suppliers..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                setEditingSupplier(null);
                                setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Add Supplier
                        </button>
                    </div>
                </div>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => {
                    const spend = getSupplierSpend(supplier.id);
                    const expenseCount = getSupplierExpenseCount(supplier.id);
                    
                    return (
                        <motion.div
                            key={supplier.id}
                            whileHover={{ y: -2 }}
                            className="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 border border-gray-200 hover:shadow-md transition p-4"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{supplier.name}</h3>
                                    {supplier.contact_person && (
                                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                            <User size={14} /> {supplier.contact_person}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1 text-sm">
                                {supplier.phone && (
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <Phone size={14} /> {supplier.phone}
                                    </p>
                                )}
                                {supplier.email && (
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <Mail size={14} /> {supplier.email}
                                    </p>
                                )}
                                {supplier.address && (
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <MapPin size={14} /> {supplier.address}
                                    </p>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-xs text-gray-500">Total Spend</span>
                                    <p className="text-sm font-bold text-blue-600">R{spend.toFixed(2)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Expenses</span>
                                    <p className="text-sm font-bold">{expenseCount}</p>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-lg border border-gray-200">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No suppliers found</p>
                    <p className="text-xs">Add a new supplier to get started</p>
                </div>
            )}
        </motion.div>
    );

    // =====================================================
    // RENDER: REPORTS TAB
    // =====================================================
    const renderReportsTab = () => {
        const { summary, spendingData, supplierPerformance, categoryBreakdown } = reportData;

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Report Controls */}
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">Period:</span>
                            {periodOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleReportPeriodChange(option.id)}
                                    className={`px-4 py-2 text-sm rounded-lg transition-all ${
                                        reportPeriod === option.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1"></div>
                        <button 
                            onClick={() => generateReportData(reportPeriod)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Download Report">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Print">
                            <Printer className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Suppliers', value: summary.totalSuppliers, icon: <Building2 className="h-4 w-4" />, color: 'blue' },
                        { label: 'Total Spend', value: `R${summary.totalSpend?.toFixed(2) || 0}`, icon: <DollarSign className="h-4 w-4" />, color: 'green' },
                        { label: 'Avg per Supplier', value: `R${summary.avgSpend?.toFixed(2) || 0}`, icon: <TrendingUp className="h-4 w-4" />, color: 'purple' },
                        { label: 'Top Supplier', value: summary.topSupplier || 'N/A', icon: <Crown className="h-4 w-4" />, color: 'yellow' }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            custom={index}
                            variants={statsCardVariants}
                            whileHover="hover"
                            className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                                    <span className={`text-${stat.color}-600`}>{stat.icon}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                    <p className="text-lg font-bold text-gray-900">{stat.value || 0}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {reportLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {/* Spending Trend Chart */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-blue-500" />
                                Spending Trend ({reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)})
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={spendingData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'amount') return [`R${value.toFixed(2)}`, 'Spend'];
                                            if (name === 'count') return [value, 'Transactions'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="amount" fill="#3b82f6" name="Spend" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#10b981" name="Transactions" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Supplier Performance & Category Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    Top Suppliers by Spend
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {supplierPerformance.slice(0, 6).map((supplier, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                    index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' :
                                                    index === 2 ? 'bg-orange-400' :
                                                    'bg-blue-400'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-sm">{supplier.name}</p>
                                                    <p className="text-xs text-gray-400">{supplier.contact || 'No contact'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-600">R{supplier.total?.toFixed(2) || 0}</p>
                                                <p className="text-xs text-gray-400">{supplier.count} transactions</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-purple-500" />
                                    Spend by Category
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RePieChart>
                                            <Pie
                                                data={categoryBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `R${value.toFixed(2)}`} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-col justify-center gap-2">
                                        {categoryBreakdown.slice(0, 5).map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-blue-600">R{item.value?.toFixed(2) || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        );
    };

    // =====================================================
    // RENDER: INSIGHTS TAB
    // =====================================================
    const renderInsightsTab = () => {
        const totalSpend = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const totalSuppliers = suppliers.length;
        const avgSpend = totalSuppliers > 0 ? totalSpend / totalSuppliers : 0;
        const topSupplier = suppliers.reduce((max, s) => {
            const sExpense = expenses.filter(e => e.supplier_id === s.id).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            return sExpense > max.expense ? { name: s.name, expense: sExpense } : max;
        }, { name: 'N/A', expense: 0 });

        // Calculate supplier concentration (Pareto - top 20% suppliers)
        const sortedSuppliers = suppliers.map(s => ({
            name: s.name,
            spend: expenses.filter(e => e.supplier_id === s.id).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
        })).sort((a, b) => b.spend - a.spend);
        
        const top20Count = Math.ceil(sortedSuppliers.length * 0.2);
        const top20Spend = sortedSuppliers.slice(0, top20Count).reduce((sum, s) => sum + s.spend, 0);
        const concentration = totalSpend > 0 ? (top20Spend / totalSpend * 100) : 0;

        // Supplier with most transactions
        const mostTransactions = suppliers.reduce((max, s) => {
            const count = expenses.filter(e => e.supplier_id === s.id).length;
            return count > max.count ? { name: s.name, count } : max;
        }, { name: 'N/A', count: 0 });

        const insights = [
            {
                title: 'Supplier Concentration',
                value: `${concentration.toFixed(1)}%`,
                description: concentration > 60 ? 'High supplier concentration. Consider diversifying.' :
                           concentration > 40 ? 'Moderate concentration. Monitor supplier performance.' :
                           'Low concentration. Good supplier diversity.',
                color: concentration > 60 ? 'red' : concentration > 40 ? 'yellow' : 'green',
                icon: <PieChart className="h-6 w-6" />
            },
            {
                title: 'Average Spend per Supplier',
                value: `R${avgSpend.toFixed(2)}`,
                description: avgSpend > 50000 ? 'High average spend. Review supplier contracts.' :
                           avgSpend > 20000 ? 'Moderate average spend.' :
                           'Low average spend. Good cost control.',
                color: avgSpend > 50000 ? 'orange' : avgSpend > 20000 ? 'blue' : 'green',
                icon: <DollarSign className="h-6 w-6" />
            },
            {
                title: 'Top Supplier',
                value: topSupplier.name,
                description: `Spent R${topSupplier.expense.toFixed(2)}. ${topSupplier.expense > totalSpend * 0.4 ? 'High dependency risk.' : 'Healthy supplier relationship.'}`,
                color: topSupplier.expense > totalSpend * 0.4 ? 'orange' : 'green',
                icon: <Crown className="h-6 w-6" />
            },
            {
                title: 'Most Active Supplier',
                value: mostTransactions.name,
                description: `${mostTransactions.count} transactions. ${mostTransactions.count > 10 ? 'High engagement supplier.' : 'Moderate engagement.'}`,
                color: mostTransactions.count > 10 ? 'blue' : 'green',
                icon: <Activity className="h-6 w-6" />
            }
        ];

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {insights.map((insight, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`bg-white rounded-lg p-6 border-l-4 ${
                                insight.color === 'green' ? 'border-green-500' :
                                insight.color === 'yellow' ? 'border-yellow-500' :
                                insight.color === 'red' ? 'border-red-500' :
                                insight.color === 'orange' ? 'border-orange-500' :
                                'border-blue-500'
                            } border border-gray-200 shadow-sm`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${
                                    insight.color === 'green' ? 'bg-green-100 text-green-600' :
                                    insight.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                    insight.color === 'red' ? 'bg-red-100 text-red-600' :
                                    insight.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {insight.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{insight.title}</h3>
                                        <span className={`text-2xl font-bold ${
                                            insight.color === 'green' ? 'text-green-600' :
                                            insight.color === 'yellow' ? 'text-yellow-600' :
                                            insight.color === 'red' ? 'text-red-600' :
                                            insight.color === 'orange' ? 'text-orange-600' :
                                            'text-blue-600'
                                        }`}>
                                            {insight.value}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                    {insight.title === 'Supplier Concentration' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    concentration > 60 ? 'bg-red-500' :
                                                    concentration > 40 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(concentration, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {insight.title === 'Average Spend per Supplier' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    avgSpend > 50000 ? 'bg-orange-500' :
                                                    avgSpend > 20000 ? 'bg-blue-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(avgSpend / 100000 * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Supplier Summary Table */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Supplier Summary
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-500">
                                    <th className="py-2 px-3">Supplier</th>
                                    <th className="py-2 px-3">Contact</th>
                                    <th className="py-2 px-3 text-right">Total Spend</th>
                                    <th className="py-2 px-3 text-center">Transactions</th>
                                    <th className="py-2 px-3 text-right">Avg per Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {suppliers.slice(0, 10).map((supplier) => {
                                    const spend = getSupplierSpend(supplier.id);
                                    const count = getSupplierExpenseCount(supplier.id);
                                    const avg = count > 0 ? spend / count : 0;
                                    return (
                                        <tr key={supplier.id} className="hover:bg-gray-50 transition">
                                            <td className="py-2 px-3 font-medium">{supplier.name}</td>
                                            <td className="py-2 px-3">{supplier.contact_person || '-'}</td>
                                            <td className="py-2 px-3 text-right font-medium text-blue-600">R{spend.toFixed(2)}</td>
                                            <td className="py-2 px-3 text-center">{count}</td>
                                            <td className="py-2 px-3 text-right">R{avg.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {suppliers.length > 10 && (
                        <div className="mt-2 text-sm text-gray-400 text-center">
                            Showing top 10 of {suppliers.length} suppliers
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    // =====================================================
    // MAIN RENDER
    // =====================================================
    return (
        <motion.div 
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Building2 className="h-7 w-7 mr-2 text-blue-500" />
                        Suppliers
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage suppliers, track spending, and analyze vendor performance
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={refreshData}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </motion.button>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.icon}
                            <span className="ml-2">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </motion.div>

            {/* Tab Content */}
            {activeTab === 'list' && renderSuppliersList()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'insights' && renderInsightsTab()}

            {/* ===================================================== */}
            {/* SUPPLIER MODAL (Add/Edit) */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <motion.div 
                            variants={{
                                hidden: { opacity: 0 },
                                visible: { opacity: 1 },
                                exit: { opacity: 0 }
                            }}
                            className="flex min-h-screen items-center justify-center p-4"
                        >
                            <motion.div 
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { opacity: 1 },
                                    exit: { opacity: 0 }
                                }}
                                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                                onClick={() => setShowModal(false)}
                            />
                            
                            <motion.div 
                                variants={{
                                    hidden: { opacity: 0, scale: 0.95, y: 20 },
                                    visible: { 
                                        opacity: 1, 
                                        scale: 1, 
                                        y: 0,
                                        transition: {
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 25
                                        }
                                    },
                                    exit: { 
                                        opacity: 0, 
                                        scale: 0.95, 
                                        y: 20 
                                    }
                                }}
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`rounded-lg p-2 ${editingSupplier ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                                {editingSupplier ? <Edit className="h-5 w-5 text-yellow-600" /> : <Building2 className="h-5 w-5 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {editingSupplier ? 'Update supplier details' : 'Add a new supplier'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingSupplier(null);
                                            }}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Supplier Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter supplier name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                                <input
                                                    type="text"
                                                    value={formData.contact_person}
                                                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Contact person name"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Phone number"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Email address"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                                <textarea
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    placeholder="Street address"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    setEditingSupplier(null);
                                                }}
                                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}