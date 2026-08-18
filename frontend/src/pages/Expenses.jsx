import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet, Plus, Edit, Trash2, Calendar, Tag, FileText,
    Loader2, X, TrendingDown, PieChart, BarChart3,
    LineChart, Download, Printer, RefreshCw, Filter,
    Search, AlertTriangle, Info, Activity, Zap, Target,
    DollarSign, TrendingUp, Award, Crown, Medal,
    ChevronDown, ChevronUp, Building2, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, 
    PieChart as RePieChart, Pie, Cell,
    LineChart as ReLineChart, Line,
    ComposedChart, Area
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f472b6', '#22d3ee'];

const EXPENSE_CATEGORIES = [
    'Raw Materials',
    'Utilities',
    'Wages',
    'Transport',
    'Maintenance',
    'Marketing',
    'Rent',
    'Insurance',
    'Tax',
    'Other'
];

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
// EXPENSE METRICS COMPONENT
// =====================================================
const ExpenseMetrics = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No expense data available</p>
                <p className="text-xs">Add an expense to see metrics</p>
            </div>
        );
    }

    const totalExpenses = data.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalCount = data.length;
    const avgExpense = totalCount > 0 ? totalExpenses / totalCount : 0;
    const maxExpense = data.reduce((max, e) => Math.max(max, parseFloat(e.amount || 0)), 0);
    const categoryCount = new Set(data.map(e => e.category)).size;

    const metrics = [
        { 
            label: 'Total Expenses', 
            value: `R${totalExpenses.toFixed(2)}`, 
            icon: <DollarSign className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        { 
            label: 'Number of Expenses', 
            value: totalCount, 
            icon: <FileText className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        { 
            label: 'Average Expense', 
            value: `R${avgExpense.toFixed(2)}`, 
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        { 
            label: 'Categories Used', 
            value: categoryCount, 
            icon: <Tag className="h-5 w-5" />,
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
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
// MAIN EXPENSES COMPONENT
// =====================================================
export default function Expenses() {
    // =====================================================
    // STATE
    // =====================================================
    const [expenses, setExpenses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'expense_date', direction: 'desc' });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    // Report State
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [reportData, setReportData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        categoryBreakdown: [],
        topExpenses: [],
        trends: [],
        summary: {
            totalExpenses: 0,
            totalCount: 0,
            avgExpense: 0,
            topCategory: '',
            topCategoryAmount: 0
        }
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        supplier_id: ''
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
            const [expensesRes, suppliersRes] = await Promise.all([
                axios.get('/api/expenses'),
                axios.get('/api/suppliers')
            ]);
            setExpenses(expensesRes.data);
            setSuppliers(suppliersRes.data);
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

        // Generate time series data
        const trends = Array.from({ length: count }, (_, i) => {
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

        // Category breakdown
        const categoryMap = {};
        expenses.forEach(e => {
            const cat = e.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.amount || 0);
        });
        const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100
        })).sort((a, b) => b.value - a.value);

        // Top expenses
        const topExpenses = [...expenses]
            .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
            .slice(0, 10)
            .map(e => ({
                ...e,
                amount: parseFloat(e.amount)
            }));

        // Summary stats
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const totalCount = expenses.length;
        const avgExpense = totalCount > 0 ? totalExpenses / totalCount : 0;
        const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

        setReportData({
            daily: trends,
            weekly: trends,
            monthly: trends,
            categoryBreakdown,
            topExpenses,
            trends,
            summary: {
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                totalCount,
                avgExpense: Math.round(avgExpense * 100) / 100,
                topCategory: topCategory ? topCategory.name : 'N/A',
                topCategoryAmount: topCategory ? topCategory.value : 0
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
            if (editingExpense) {
                await axios.put(`/api/expenses/${editingExpense.id}`, formData);
                toast.success('Expense updated successfully');
            } else {
                await axios.post('/api/expenses', formData);
                toast.success('Expense created successfully');
            }
            setShowModal(false);
            setEditingExpense(null);
            setFormData({
                category: '',
                description: '',
                amount: '',
                expense_date: new Date().toISOString().split('T')[0],
                supplier_id: ''
            });
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save expense');
        }
    };

    const handleEdit = (expense) => {
        setEditingExpense(expense);
        setFormData({
            category: expense.category,
            description: expense.description || '',
            amount: expense.amount.toString(),
            expense_date: new Date(expense.expense_date).toISOString().split('T')[0],
            supplier_id: expense.supplier_id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            await axios.delete(`/api/expenses/${id}`);
            toast.success('Expense deleted successfully');
            refreshData();
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleReportPeriodChange = (period) => {
        setReportPeriod(period);
        generateReportData(period);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             expense.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        const matchesDate = (!dateRange.start || expense.expense_date >= dateRange.start) &&
                           (!dateRange.end || expense.expense_date <= dateRange.end);
        return matchesSearch && matchesCategory && matchesDate;
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    const categoryTotals = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount || 0);
        return acc;
    }, {});

    const tabs = [
        { id: 'list', label: 'Expenses', icon: <FileText size={16} /> },
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
    // RENDER: EXPENSES LIST TAB
    // =====================================================
    const renderExpensesList = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Expense Metrics */}
            <ExpenseMetrics data={expenses} />

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
                            placeholder="Search expenses..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Start"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="End"
                            />
                        </div>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('all');
                                setDateRange({ start: '', end: '' });
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                setEditingExpense(null);
                                setFormData({
                                    category: '',
                                    description: '',
                                    amount: '',
                                    expense_date: new Date().toISOString().split('T')[0],
                                    supplier_id: ''
                                });
                                setShowModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Add Expense
                        </button>
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'expense_date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Date
                                        {sortConfig.key === 'expense_date' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium">Category</th>
                                <th className="py-3 px-4 font-medium">Description</th>
                                <th className="py-3 px-4 font-medium">Supplier</th>
                                <th className="py-3 px-4 font-medium text-right">Amount</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-400">
                                        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No expenses found</p>
                                        <p className="text-xs">Add a new expense to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense, index) => (
                                    <motion.tr 
                                        key={expense.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4">{new Date(expense.expense_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{expense.description || '-'}</td>
                                        <td className="py-3 px-4">{expense.supplier_name || '-'}</td>
                                        <td className="py-3 px-4 text-right font-medium text-red-600">R{parseFloat(expense.amount).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
                    <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
                    <span>Total: <strong className="text-red-600">R{expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)}</strong></span>
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: REPORTS TAB
    // =====================================================
    const renderReportsTab = () => {
        const { summary, trends, categoryBreakdown, topExpenses } = reportData;

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
                        { label: 'Total Expenses', value: `R${summary.totalExpenses?.toFixed(2) || 0}`, icon: <DollarSign className="h-4 w-4" />, color: 'red' },
                        { label: 'Number of Expenses', value: summary.totalCount, icon: <FileText className="h-4 w-4" />, color: 'blue' },
                        { label: 'Average Expense', value: `R${summary.avgExpense?.toFixed(2) || 0}`, icon: <TrendingUp className="h-4 w-4" />, color: 'green' },
                        { label: 'Top Category', value: summary.topCategory || 'N/A', icon: <Award className="h-4 w-4" />, color: 'yellow' }
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
                        {/* Expense Trend Chart */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-blue-500" />
                                Expense Trend ({reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)})
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'amount') return [`R${value.toFixed(2)}`, 'Amount'];
                                            if (name === 'count') return [value, 'Transactions'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="amount" fill="#ef4444" name="Amount" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" name="Transactions" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Category Breakdown & Top Expenses */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-purple-500" />
                                    Expense by Category
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
                                                <span className="text-sm font-bold text-red-600">R{item.value?.toFixed(2) || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    Top 5 Largest Expenses
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {topExpenses.slice(0, 5).map((expense, index) => (
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
                                                    <p className="font-medium text-sm">{expense.description || expense.category}</p>
                                                    <p className="text-xs text-gray-400">{new Date(expense.expense_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">R{expense.amount?.toFixed(2) || 0}</p>
                                                <p className="text-xs text-gray-400">{expense.category}</p>
                                            </div>
                                        </div>
                                    ))}
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
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const totalCount = expenses.length;
        const avgExpense = totalCount > 0 ? totalExpenses / totalCount : 0;
        const maxExpense = expenses.reduce((max, e) => Math.max(max, parseFloat(e.amount || 0)), 0);
        
        // Category analysis
        const categoryMap = {};
        expenses.forEach(e => {
            const cat = e.category || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + parseFloat(e.amount || 0);
        });
        const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
        const topCategoryPercentage = totalExpenses > 0 && topCategory ? (topCategory[1] / totalExpenses * 100) : 0;

        // Monthly trend analysis
        const monthlyData = {};
        expenses.forEach(e => {
            const month = new Date(e.expense_date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + parseFloat(e.amount || 0);
        });
        const monthlyValues = Object.values(monthlyData);
        const avgMonthly = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
        const maxMonth = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0;

        const insights = [
            {
                title: 'Top Expense Category',
                value: topCategory ? topCategory[0] : 'N/A',
                description: topCategory ? `${topCategoryPercentage.toFixed(1)}% of total expenses (R${topCategory[1].toFixed(2)})` : 'No expenses recorded',
                color: topCategoryPercentage > 50 ? 'red' : topCategoryPercentage > 30 ? 'yellow' : 'green',
                icon: <Tag className="h-6 w-6" />
            },
            {
                title: 'Average Expense',
                value: `R${avgExpense.toFixed(2)}`,
                description: avgExpense > 5000 ? 'High average expense. Review spending patterns.' :
                           avgExpense > 2000 ? 'Moderate average expense.' :
                           'Low average expense. Good cost control.',
                color: avgExpense > 5000 ? 'orange' : avgExpense > 2000 ? 'blue' : 'green',
                icon: <DollarSign className="h-6 w-6" />
            },
            {
                title: 'Highest Single Expense',
                value: `R${maxExpense.toFixed(2)}`,
                description: maxExpense > totalExpenses * 0.2 ? 'Large single expense. Review for accuracy.' :
                           'Expenses are well distributed.',
                color: maxExpense > totalExpenses * 0.2 ? 'orange' : 'green',
                icon: <AlertTriangle className="h-6 w-6" />
            },
            {
                title: 'Monthly Spending Average',
                value: `R${avgMonthly.toFixed(2)}`,
                description: maxMonth > avgMonthly * 1.5 ? 'Spike in spending detected. Review monthly trends.' :
                           'Spending is consistent month to month.',
                color: maxMonth > avgMonthly * 1.5 ? 'yellow' : 'green',
                icon: <Calendar className="h-6 w-6" />
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
                                    {insight.title === 'Top Expense Category' && topCategory && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    topCategoryPercentage > 50 ? 'bg-red-500' :
                                                    topCategoryPercentage > 30 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(topCategoryPercentage, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {insight.title === 'Average Expense' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    avgExpense > 5000 ? 'bg-orange-500' :
                                                    avgExpense > 2000 ? 'bg-blue-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(avgExpense / 10000 * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Expense Summary */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Expense Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Expenses</p>
                            <p className="text-xl font-bold text-red-600">R{totalExpenses.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Number of Expenses</p>
                            <p className="text-xl font-bold">{totalCount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Average Expense</p>
                            <p className="text-xl font-bold">R{avgExpense.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Categories Used</p>
                            <p className="text-xl font-bold">{Object.keys(categoryMap).length}</p>
                        </div>
                    </div>
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
                        <Wallet className="h-7 w-7 mr-2 text-blue-500" />
                        Expenses
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Track expenses, analyze spending patterns, and manage costs
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
            {activeTab === 'list' && renderExpensesList()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'insights' && renderInsightsTab()}

            {/* ===================================================== */}
            {/* EXPENSE MODAL (Add/Edit) */}
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
                                            <div className={`rounded-lg p-2 ${editingExpense ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                                {editingExpense ? <Edit className="h-5 w-5 text-yellow-600" /> : <Wallet className="h-5 w-5 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {editingExpense ? 'Edit Expense' : 'Add Expense'}
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {editingExpense ? 'Update expense details' : 'Add a new expense'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingExpense(null);
                                            }}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Category *</label>
                                                <select
                                                    required
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Category</option>
                                                    {EXPENSE_CATEGORIES.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Brief description"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Amount *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.expense_date}
                                                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                                                <select
                                                    value={formData.supplier_id}
                                                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Supplier</option>
                                                    {suppliers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                {editingExpense ? 'Update Expense' : 'Add Expense'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    setEditingExpense(null);
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