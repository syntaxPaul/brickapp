//frontend/src/pages/Wastage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Plus, Trash2, Package, Factory,
    Calendar, Loader2, X, TrendingDown, BarChart3,
    PieChart, LineChart, Download, Printer, RefreshCw,
    Filter, Search, Eye, Edit, Activity, Zap, Target,
    DollarSign, TrendingUp, Award, Crown, Medal,
    ChevronDown, ChevronUp, Building2, Users, Clock,
    FileText, Info, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseNumber, parseIntSafe, parseWastages, parseProducts, parseProductionBatches } from '../utils/parsers';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell,
    LineChart as ReLineChart, Line,
    ComposedChart, Area
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f472b6', '#22d3ee'];
const WASTAGE_REASONS = [
    'Production Error',
    'Raw Material Issue',
    'Handling Damage',
    'Quality Control Rejection',
    'Machine Malfunction',
    'Expired Stock',
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
// WASTAGE METRICS COMPONENT
// =====================================================
const WastageMetrics = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No wastage data available</p>
                <p className="text-xs">Log a wastage record to see metrics</p>
            </div>
        );
    }

    const totalCost = data.reduce((sum, w) => sum + parseNumber(w.cost_impact), 0);
    const totalQuantity = data.reduce((sum, w) => sum + parseIntSafe(w.quantity), 0);
    const totalRecords = data.length;
    const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    const topReason = data.reduce((max, w) => {
        const count = data.filter(item => item.reason === w.reason).length;
        return count > max.count ? { reason: w.reason, count } : max;
    }, { reason: 'N/A', count: 0 });

    const metrics = [
        {
            label: 'Total Cost',
            value: `R${totalCost.toFixed(2)}`,
            icon: <DollarSign className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        {
            label: 'Units Wasted',
            value: totalQuantity.toLocaleString(),
            icon: <Package className="h-5 w-5" />,
            color: 'orange',
            bgColor: 'bg-orange-100',
            iconColor: 'text-orange-600'
        },
        {
            label: 'Records',
            value: totalRecords,
            icon: <FileText className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Avg Cost/Unit',
            value: `R${avgCostPerUnit.toFixed(2)}`,
            icon: <TrendingUp className="h-5 w-5" />,
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
// MAIN WASTAGE COMPONENT
// =====================================================
export default function Wastage() {
    // =====================================================
    // STATE
    // =====================================================
    const [wastage, setWastage] = useState([]);
    const [products, setProducts] = useState([]);
    const [machines, setMachines] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedWastage, setSelectedWastage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    // Report State
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [reportData, setReportData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        reasonBreakdown: [],
        productWastage: [],
        machineWastage: [],
        trends: [],
        summary: {
            totalCost: 0,
            totalQuantity: 0,
            totalRecords: 0,
            avgCostPerUnit: 0,
            topReason: '',
            topReasonCount: 0
        }
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        product_id: '',
        machine_id: '',
        production_batch_id: '',
        quantity: '',
        reason: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
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
            const [wastageRes, productsRes, machinesRes, batchesRes] = await Promise.all([
                axios.get('/api/wastage'),
                axios.get('/api/products'),
                axios.get('/api/production/machines'),
                axios.get('/api/production/batches')
            ]);
            
            setWastage(parseWastages(wastageRes.data));
            setProducts(parseProducts(productsRes.data));
            setMachines(machinesRes.data.map(m => ({
                ...m,
                daily_capacity: parseIntSafe(m.daily_capacity),
                total_batches: parseIntSafe(m.total_batches),
                total_produced: parseIntSafe(m.total_produced),
                total_rejected: parseIntSafe(m.total_rejected)
            })));
            setBatches(parseProductionBatches(batchesRes.data));
        } catch (error) {
            console.error('Failed to load wastage data:', error);
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
            
            const dayWastage = wastage.filter(w => {
                const wDate = new Date(w.date);
                return wDate.toDateString() === date.toDateString();
            });

            const totalQty = dayWastage.reduce((sum, w) => sum + parseIntSafe(w.quantity), 0);
            const totalCost = dayWastage.reduce((sum, w) => sum + parseNumber(w.cost_impact), 0);
            const recordCount = dayWastage.length;

            return {
                label: date.toLocaleDateString('en-ZA', { 
                    month: 'short', 
                    day: period === 'daily' || period === 'weekly' ? 'numeric' : undefined,
                    year: period === 'monthly' ? 'numeric' : undefined
                }),
                quantity: totalQty,
                cost: Math.round(totalCost * 100) / 100,
                count: recordCount,
                date
            };
        });

        // Reason breakdown
        const reasonMap = {};
        wastage.forEach(w => {
            const reason = w.reason || 'Other';
            reasonMap[reason] = (reasonMap[reason] || 0) + parseIntSafe(w.quantity);
        });
        const reasonBreakdown = Object.entries(reasonMap).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);

        // Product wastage
        const productMap = {};
        wastage.forEach(w => {
            const name = w.product_name || `Product #${w.product_id}`;
            productMap[name] = (productMap[name] || 0) + parseIntSafe(w.quantity);
        });
        const productWastage = Object.entries(productMap).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);

        // Machine wastage
        const machineMap = {};
        wastage.forEach(w => {
            const name = w.machine_name || `Machine #${w.machine_id}`;
            machineMap[name] = (machineMap[name] || 0) + parseIntSafe(w.quantity);
        });
        const machineWastage = Object.entries(machineMap).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => b.value - a.value);

        // Summary stats
        const totalCost = wastage.reduce((sum, w) => sum + parseNumber(w.cost_impact), 0);
        const totalQuantity = wastage.reduce((sum, w) => sum + parseIntSafe(w.quantity), 0);
        const totalRecords = wastage.length;
        const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        const topReason = reasonBreakdown.length > 0 ? reasonBreakdown[0] : null;

        setReportData({
            daily: trends,
            weekly: trends,
            monthly: trends,
            reasonBreakdown,
            productWastage,
            machineWastage,
            trends,
            summary: {
                totalCost: Math.round(totalCost * 100) / 100,
                totalQuantity,
                totalRecords,
                avgCostPerUnit: Math.round(avgCostPerUnit * 100) / 100,
                topReason: topReason ? topReason.name : 'N/A',
                topReasonCount: topReason ? topReason.value : 0
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
            await axios.post('/api/wastage', {
                ...formData,
                quantity: parseInt(formData.quantity)
            });
            toast.success('Wastage record created successfully');
            setShowModal(false);
            setFormData({
                product_id: '',
                machine_id: '',
                production_batch_id: '',
                quantity: '',
                reason: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            refreshData();
        } catch (error) {
            console.error('Failed to create wastage:', error);
            toast.error(error.response?.data?.error || 'Failed to create wastage record');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this wastage record?')) return;
        try {
            await axios.delete(`/api/wastage/${id}`);
            toast.success('Wastage record deleted successfully');
            refreshData();
        } catch (error) {
            console.error('Failed to delete wastage:', error);
            toast.error('Failed to delete wastage record');
        }
    };

    const handleViewDetails = (wastageItem) => {
        setSelectedWastage(wastageItem);
        setShowDetailModal(true);
    };

    const handleReportPeriodChange = (period) => {
        setReportPeriod(period);
        generateReportData(period);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const getReasonColor = (reason) => {
        const colors = {
            'Production Error': 'bg-red-100 text-red-700',
            'Raw Material Issue': 'bg-orange-100 text-orange-700',
            'Handling Damage': 'bg-yellow-100 text-yellow-700',
            'Quality Control Rejection': 'bg-purple-100 text-purple-700',
            'Machine Malfunction': 'bg-blue-100 text-blue-700',
            'Expired Stock': 'bg-gray-100 text-gray-700',
            'Other': 'bg-gray-100 text-gray-700'
        };
        return colors[reason] || 'bg-gray-100 text-gray-700';
    };

    const getReasonIcon = (reason) => {
        switch(reason) {
            case 'Production Error': return <AlertCircle className="h-3 w-3" />;
            case 'Raw Material Issue': return <Package className="h-3 w-3" />;
            case 'Handling Damage': return <AlertTriangle className="h-3 w-3" />;
            case 'Quality Control Rejection': return <X className="h-3 w-3" />;
            case 'Machine Malfunction': return <Factory className="h-3 w-3" />;
            case 'Expired Stock': return <Clock className="h-3 w-3" />;
            default: return <AlertTriangle className="h-3 w-3" />;
        }
    };

    const filteredWastage = wastage.filter(item => {
        const matchesSearch = item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.machine_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReason = reasonFilter === 'all' || item.reason === reasonFilter;
        const matchesDate = (!dateRange.start || item.date >= dateRange.start) &&
                           (!dateRange.end || item.date <= dateRange.end);
        return matchesSearch && matchesReason && matchesDate;
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
        { id: 'list', label: 'Wastage Records', icon: <AlertTriangle size={16} /> },
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
    // RENDER: WASTAGE LIST TAB
    // =====================================================
    const renderWastageList = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Wastage Metrics */}
            <WastageMetrics data={wastage} />

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
                            placeholder="Search wastage records..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={reasonFilter}
                                onChange={(e) => setReasonFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Reasons</option>
                                {WASTAGE_REASONS.map(r => (
                                    <option key={r} value={r}>{r}</option>
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
                                setReasonFilter('all');
                                setDateRange({ start: '', end: '' });
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Log Wastage
                        </button>
                    </div>
                </div>
            </div>

            {/* Wastage Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Date
                                        {sortConfig.key === 'date' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium">Product</th>
                                <th className="py-3 px-4 font-medium">Machine</th>
                                <th className="py-3 px-4 font-medium text-right">Quantity</th>
                                <th className="py-3 px-4 font-medium">Reason</th>
                                <th className="py-3 px-4 font-medium text-right">Cost Impact</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredWastage.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-400">
                                        <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No wastage records found</p>
                                        <p className="text-xs">Log a wastage record to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredWastage.map((item, index) => (
                                    <motion.tr 
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4">{new Date(item.date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{item.product_name || `Product #${item.product_id}`}</td>
                                        <td className="py-3 px-4">{item.machine_name || '-'}</td>
                                        <td className="py-3 px-4 text-right font-medium">{item.quantity?.toLocaleString()}</td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getReasonColor(item.reason)}`}>
                                                {getReasonIcon(item.reason)}
                                                {item.reason}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-red-600">R{parseNumber(item.cost_impact).toFixed(2)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleViewDetails(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
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
                    <span>Showing {filteredWastage.length} of {wastage.length} records</span>
                    <span>Total Cost: <strong className="text-red-600">R{wastage.reduce((sum, w) => sum + parseNumber(w.cost_impact), 0).toFixed(2)}</strong></span>
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: REPORTS TAB
    // =====================================================
    const renderReportsTab = () => {
        const { summary, trends, reasonBreakdown, productWastage, machineWastage } = reportData;

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
                        { label: 'Total Cost', value: `R${summary.totalCost?.toFixed(2) || 0}`, icon: <DollarSign className="h-4 w-4" />, color: 'red' },
                        { label: 'Units Wasted', value: summary.totalQuantity?.toLocaleString() || 0, icon: <Package className="h-4 w-4" />, color: 'orange' },
                        { label: 'Records', value: summary.totalRecords || 0, icon: <FileText className="h-4 w-4" />, color: 'blue' },
                        { label: 'Top Reason', value: summary.topReason || 'N/A', icon: <AlertTriangle className="h-4 w-4" />, color: 'yellow' }
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
                        {/* Wastage Trend Chart */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-blue-500" />
                                Wastage Trend ({reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)})
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'quantity') return [value.toLocaleString(), 'Units Wasted'];
                                            if (name === 'cost') return [`R${value.toFixed(2)}`, 'Cost'];
                                            if (name === 'count') return [value, 'Records'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="quantity" fill="#ef4444" name="Units Wasted" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#f59e0b" name="Cost" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Reason & Product Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-purple-500" />
                                    Wastage by Reason
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RePieChart>
                                            <Pie
                                                data={reasonBreakdown}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {reasonBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${value.toLocaleString()} units`} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-col justify-center gap-2">
                                        {reasonBreakdown.slice(0, 5).map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                                <span className="text-sm font-bold text-red-600">{item.value.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-orange-500" />
                                    Top Products with Wastage
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {productWastage.slice(0, 6).map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                    index === 0 ? 'bg-red-500' :
                                                    index === 1 ? 'bg-orange-400' :
                                                    index === 2 ? 'bg-yellow-500' :
                                                    'bg-blue-400'
                                                }`}>
                                                    {index + 1}
                                                </span>
                                                <p className="font-medium text-sm">{product.name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-red-600">{product.value.toLocaleString()}</p>
                                                <p className="text-xs text-gray-400">units</p>
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
        const totalCost = wastage.reduce((sum, w) => sum + parseNumber(w.cost_impact), 0);
        const totalQuantity = wastage.reduce((sum, w) => sum + parseIntSafe(w.quantity), 0);
        const totalRecords = wastage.length;
        const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;

        // Reason analysis
        const reasonMap = {};
        wastage.forEach(w => {
            const reason = w.reason || 'Other';
            reasonMap[reason] = (reasonMap[reason] || 0) + parseIntSafe(w.quantity);
        });
        const sortedReasons = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]);
        const topReason = sortedReasons.length > 0 ? sortedReasons[0] : null;
        const topReasonPercentage = totalQuantity > 0 && topReason ? (topReason[1] / totalQuantity * 100) : 0;

        // Machine analysis
        const machineMap = {};
        wastage.forEach(w => {
            if (w.machine_name) {
                machineMap[w.machine_name] = (machineMap[w.machine_name] || 0) + parseIntSafe(w.quantity);
            }
        });
        const topMachine = Object.entries(machineMap).sort((a, b) => b[1] - a[1])[0];

        // Monthly trend
        const monthlyData = {};
        wastage.forEach(w => {
            const month = new Date(w.date).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
            monthlyData[month] = (monthlyData[month] || 0) + parseNumber(w.cost_impact);
        });
        const monthlyValues = Object.values(monthlyData);
        const avgMonthly = monthlyValues.length > 0 ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length : 0;
        const maxMonth = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0;

        const insights = [
            {
                title: 'Top Wastage Reason',
                value: topReason ? topReason[0] : 'N/A',
                description: topReason ? `${topReasonPercentage.toFixed(1)}% of total wastage (${topReason[1].toLocaleString()} units)` : 'No wastage recorded',
                color: topReasonPercentage > 50 ? 'red' : topReasonPercentage > 30 ? 'yellow' : 'green',
                icon: <AlertTriangle className="h-6 w-6" />
            },
            {
                title: 'Cost per Unit',
                value: `R${avgCostPerUnit.toFixed(2)}`,
                description: avgCostPerUnit > 20 ? 'High cost per unit. Review production quality.' :
                           avgCostPerUnit > 10 ? 'Moderate cost per unit.' :
                           'Low cost per unit. Good quality control.',
                color: avgCostPerUnit > 20 ? 'red' : avgCostPerUnit > 10 ? 'yellow' : 'green',
                icon: <DollarSign className="h-6 w-6" />
            },
            {
                title: 'Total Wastage Cost',
                value: `R${totalCost.toFixed(2)}`,
                description: totalCost > 100000 ? 'Significant wastage cost. Implement quality improvements.' :
                           totalCost > 50000 ? 'Moderate wastage cost. Monitor trends.' :
                           'Low wastage cost. Good production efficiency.',
                color: totalCost > 100000 ? 'red' : totalCost > 50000 ? 'yellow' : 'green',
                icon: <TrendingDown className="h-6 w-6" />
            },
            {
                title: 'Wastage Records',
                value: totalRecords,
                description: totalRecords > 50 ? 'High number of wastage events. Review processes.' :
                           totalRecords > 20 ? 'Moderate number of events.' :
                           'Low number of events. Good control.',
                color: totalRecords > 50 ? 'orange' : totalRecords > 20 ? 'blue' : 'green',
                icon: <FileText className="h-6 w-6" />
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
                                    {insight.title === 'Top Wastage Reason' && topReason && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    topReasonPercentage > 50 ? 'bg-red-500' :
                                                    topReasonPercentage > 30 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(topReasonPercentage, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {insight.title === 'Cost per Unit' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    avgCostPerUnit > 20 ? 'bg-red-500' :
                                                    avgCostPerUnit > 10 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ width: `${Math.min(avgCostPerUnit / 50 * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Wastage Summary */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Wastage Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Cost</p>
                            <p className="text-xl font-bold text-red-600">R{totalCost.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Units Wasted</p>
                            <p className="text-xl font-bold">{totalQuantity.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg Cost/Unit</p>
                            <p className="text-xl font-bold">R{avgCostPerUnit.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Records</p>
                            <p className="text-xl font-bold">{totalRecords}</p>
                        </div>
                    </div>
                    {topMachine && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                            <span className="text-gray-500">Machine with most wastage: </span>
                            <strong className="text-gray-900">{topMachine[0]}</strong>
                            <span className="text-gray-500 ml-2">({topMachine[1].toLocaleString()} units)</span>
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
                        <AlertTriangle className="h-7 w-7 mr-2 text-red-500" />
                        Wastage Tracking
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Track wastage, analyze patterns, and improve production efficiency
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
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Log Wastage
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
            {activeTab === 'list' && renderWastageList()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'insights' && renderInsightsTab()}

            {/* ===================================================== */}
            {/* WASTAGE DETAIL MODAL */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showDetailModal && selectedWastage && (
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
                                onClick={() => setShowDetailModal(false)}
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
                                            <AlertTriangle className="h-5 w-5 text-red-500" />
                                            <h2 className="text-xl font-bold text-gray-900">Wastage Details</h2>
                                        </div>
                                        <button
                                            onClick={() => setShowDetailModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">Date</p>
                                                <p className="font-medium">{new Date(selectedWastage.date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Product</p>
                                                <p className="font-medium">{selectedWastage.product_name || `Product #${selectedWastage.product_id}`}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Machine</p>
                                                <p className="font-medium">{selectedWastage.machine_name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Quantity</p>
                                                <p className="font-medium">{selectedWastage.quantity?.toLocaleString()}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Reason</p>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getReasonColor(selectedWastage.reason)}`}>
                                                    {getReasonIcon(selectedWastage.reason)}
                                                    {selectedWastage.reason}
                                                </span>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Cost Impact</p>
                                                <p className="text-xl font-bold text-red-600">R{parseNumber(selectedWastage.cost_impact).toFixed(2)}</p>
                                            </div>
                                            {selectedWastage.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">Notes</p>
                                                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedWastage.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => handleDelete(selectedWastage.id)}
                                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-500 transition flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete Record
                                        </button>
                                        <button
                                            onClick={() => setShowDetailModal(false)}
                                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===================================================== */}
            {/* WASTAGE MODAL (Add) */}
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
                                            <div className="rounded-lg bg-red-100 p-2">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Log Wastage</h2>
                                                <p className="text-sm text-gray-500">Record a new wastage event</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Product *</label>
                                                <select
                                                    required
                                                    value={formData.product_id}
                                                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Machine</label>
                                                <select
                                                    value={formData.machine_id}
                                                    onChange={(e) => setFormData({...formData, machine_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Machine</option>
                                                    {machines.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Production Batch</label>
                                                <select
                                                    value={formData.production_batch_id}
                                                    onChange={(e) => setFormData({...formData, production_batch_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Batch</option>
                                                    {batches.map(b => (
                                                        <option key={b.id} value={b.id}>{b.batch_number}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Quantity Wasted *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={formData.quantity}
                                                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Number of units wasted"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Reason *</label>
                                                <select
                                                    required
                                                    value={formData.reason}
                                                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Reason</option>
                                                    {WASTAGE_REASONS.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    placeholder="Additional notes"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Log Wastage
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
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