//frontend/src/pages/Orders.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingCart, FileText, Loader2, Eye, Plus, 
    Calendar, User, Phone, Mail, MapPin, CreditCard,
    X, Search, Filter, TrendingUp, TrendingDown,
    DollarSign, Package, Truck, Clock, CheckCircle,
    AlertCircle, Download, Printer, RefreshCw,
    ChevronDown, ChevronUp, BarChart3, PieChart,
    LineChart, Users, Tag, Edit, Trash2, Send,
    Check, AlertTriangle, Info, MoreVertical,
    UserPlus, UserCheck, UserX, History, Star,
    MessageCircle, Building2, ClipboardList,
    ChevronLeft, ChevronRight, List, LayoutDashboard,
    Crown, Medal, Award, Shield, Box, Play, Pause,
    XCircle, Layers, Activity, Zap, Target,
    Package as PackageIcon, Boxes, Wallet, Banknote,
    CreditCard as CreditCardIcon, Smartphone, Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseNumber, parseOrder, formatCurrency, parseOrders } from '../utils/parsers';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LineChart as ReLineChart, Line,
    PieChart as RePieChart, Pie, Cell,
    AreaChart, Area, ComposedChart
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
// HELPERS
// =====================================================
const calculatePallets = (quantity, productName) => {
    const qty = parseInt(quantity);
    if (!qty || isNaN(qty)) return 0;
    
    // Small bricks: 500 per pallet, Large bricks: 50 per pallet
    const smallBrickKeywords = ['brick', 'paving', 'block', 'paver'];
    const isSmall = smallBrickKeywords.some(keyword => 
        productName?.toLowerCase().includes(keyword)
    );
    
    const perPallet = isSmall ? 500 : 50;
    return Math.ceil(qty / perPallet);
};

// =====================================================
// CUSTOMER TABLE COMPONENT
// =====================================================
const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const getAvatarColor = (name) => {
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
        'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
        'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

const getCustomerStatusBadge = (status) => {
    const statusMap = {
        'Active': { icon: <UserCheck size={12} />, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'Inactive': { icon: <UserX size={12} />, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
        'Suspended': { icon: <X size={12} />, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        'VIP': { icon: <Star size={12} />, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
    };
    return statusMap[status] || statusMap['Active'];
};

// =====================================================
// CUSTOMER TABLE COMPONENT (continued)
// =====================================================
const CustomerTable = ({ 
    customers = [],
    onViewOrders,
    onCreateOrder,
    onEdit,
    onDelete,
    onAddCustomer
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({
        column: 'name',
        direction: 'ascending'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const itemsPerPage = 10;

    const sortedAndFilteredCustomers = useMemo(() => {
        let filtered = customers.filter(customer => {
            const search = searchQuery.toLowerCase();
            return (
                customer.name?.toLowerCase().includes(search) ||
                customer.company?.toLowerCase().includes(search) ||
                customer.email?.toLowerCase().includes(search) ||
                customer.phone?.includes(search)
            );
        });

        return filtered.sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];

            if (typeof first === 'number' && typeof second === 'number') {
                return sortDescriptor.direction === 'descending' ? second - first : first - second;
            }

            if (typeof first === 'string' && typeof second === 'string') {
                let cmp = first.localeCompare(second);
                return sortDescriptor.direction === 'descending' ? cmp * -1 : cmp;
            }

            return 0;
        });
    }, [customers, searchQuery, sortDescriptor]);

    const totalPages = Math.ceil(sortedAndFilteredCustomers.length / itemsPerPage);
    const paginatedCustomers = sortedAndFilteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (column) => {
        setSortDescriptor(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    const handleSelectAll = () => {
        if (selectedCustomers.length === paginatedCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(paginatedCustomers.map(c => c.id));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedCustomers(prev =>
            prev.includes(id)
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    };

    const getSortIcon = (column) => {
        if (sortDescriptor.column !== column) {
            return <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition" />;
        }
        return sortDescriptor.direction === 'ascending' 
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />;
    };

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    const Pagination = ({ currentPage, totalPages, onPageChange }) => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }

        const getVisiblePages = () => {
            if (totalPages <= 7) return pages;
            
            const visible = [];
            if (currentPage <= 3) {
                visible.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
            } else if (currentPage >= totalPages - 2) {
                visible.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                visible.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
            return visible;
        };

        return (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, sortedAndFilteredCustomers.length)}</span> of{' '}
                    <span className="font-medium">{sortedAndFilteredCustomers.length}</span> customers
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    {getVisiblePages().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white font-medium'
                                    : page === '...'
                                    ? 'text-gray-400 cursor-default'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                            disabled={page === '...'}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-lg">
                            <Users size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Customers</p>
                            <p className="text-xl font-bold">{totalCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-50 rounded-lg">
                            <UserCheck size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-xl font-bold text-green-600">{activeCustomers}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-50 rounded-lg">
                            <DollarSign size={20} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Revenue</p>
                            <p className="text-xl font-bold text-purple-600">{formatCurrency(totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-50 rounded-lg">
                            <Clock size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Avg Orders/Customer</p>
                            <p className="text-xl font-bold text-orange-600">
                                {totalCustomers > 0 ? (customers.reduce((sum, c) => sum + (c.orders || 0), 0) / totalCustomers).toFixed(1) : '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCustomers.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm(`Delete ${selectedCustomers.length} customers?`)) {
                                        selectedCustomers.forEach(id => onDelete && onDelete(id));
                                        setSelectedCustomers([]);
                                    }
                                }}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                                Delete Selected ({selectedCustomers.length})
                            </button>
                        )}
                        <button
                            onClick={onAddCustomer}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <UserPlus size={16} /> Add Customer
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b bg-gray-50/80">
                                <th className="py-3 px-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedCustomers.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Customer
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('name')}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group hidden md:table-cell"
                                    onClick={() => handleSort('company')}
                                >
                                    <div className="flex items-center gap-1">
                                        Company
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('company')}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group hidden lg:table-cell"
                                    onClick={() => handleSort('phone')}
                                >
                                    <div className="flex items-center gap-1">
                                        Contact
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('phone')}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group text-center"
                                    onClick={() => handleSort('orders')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Orders
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('orders')}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group text-right"
                                    onClick={() => handleSort('totalSpent')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Total Spent
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('totalSpent')}
                                        </span>
                                    </div>
                                </th>
                                <th 
                                    className="py-3 px-4 font-medium cursor-pointer hover:text-gray-700 group text-center hidden sm:table-cell"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Status
                                        <span className="group-hover:opacity-100">
                                            {getSortIcon('status')}
                                        </span>
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400">
                                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No customers found</p>
                                        <p className="text-xs">Try adjusting your search or add a new customer</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => {
                                    const statusBadge = getCustomerStatusBadge(customer.status);
                                    const avatarColor = getAvatarColor(customer.name);
                                    const initials = getInitials(customer.name);
                                    const isSelected = selectedCustomers.includes(customer.id);

                                    return (
                                        <tr 
                                            key={customer.id} 
                                            className={`border-b hover:bg-gray-50/50 transition group ${
                                                isSelected ? 'bg-blue-50/30' : ''
                                            }`}
                                        >
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(customer.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full ${avatarColor} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-800">{customer.name}</p>
                                                        <p className="text-xs text-gray-400">{customer.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden md:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 size={14} className="text-gray-400" />
                                                    <span className="text-sm">{customer.company || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 hidden lg:table-cell">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span>{customer.phone || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        <span className="truncate max-w-[150px]">{customer.address || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="font-medium">{customer.orders || 0}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="font-bold text-green-600">
                                                    {formatCurrency(customer.totalSpent || 0)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center hidden sm:table-cell">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                                                    {statusBadge.icon}
                                                    {customer.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => onViewOrders && onViewOrders(customer)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        title="View Orders"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onCreateOrder && onCreateOrder(customer)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                        title="Create Order"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit && onEdit(customer)}
                                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete customer "${customer.name}"?`)) {
                                                                onDelete && onDelete(customer.id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {sortedAndFilteredCustomers.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
};

// =====================================================
// ORDER TIMELINE COMPONENT
// =====================================================
const STATUS_CONFIG = {
    PENDING: { 
        label: 'Pending', 
        icon: Clock, 
        color: 'bg-gray-500', 
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-100'
    },
    PRODUCTION: { 
        label: 'In Production', 
        icon: Package, 
        color: 'bg-blue-500', 
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    QUALITY_CHECK: { 
        label: 'Quality Check', 
        icon: Shield, 
        color: 'bg-purple-500', 
        textColor: 'text-purple-600',
        bgColor: 'bg-purple-50'
    },
    PACKAGING: { 
        label: 'Packaging', 
        icon: Box, 
        color: 'bg-yellow-500', 
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
    },
    DISPATCHED: { 
        label: 'Dispatched', 
        icon: Truck, 
        color: 'bg-indigo-500', 
        textColor: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
    },
    IN_TRANSIT: { 
        label: 'In Transit', 
        icon: Send, 
        color: 'bg-cyan-500', 
        textColor: 'text-cyan-600',
        bgColor: 'bg-cyan-50'
    },
    DELIVERED: { 
        label: 'Delivered', 
        icon: CheckCircle, 
        color: 'bg-green-500', 
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
    },
    COMPLETED: { 
        label: 'Completed', 
        icon: CheckCircle, 
        color: 'bg-green-500', 
        textColor: 'text-green-600',
        bgColor: 'bg-green-50'
    },
    CANCELLED: { 
        label: 'Cancelled', 
        icon: XCircle, 
        color: 'bg-red-500', 
        textColor: 'text-red-600',
        bgColor: 'bg-red-50'
    }
};

const STATUS_ORDER = ['PENDING', 'PRODUCTION', 'QUALITY_CHECK', 'PACKAGING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'];

const OrderTimeline = ({ orderId, onUpdate }) => {
    const [timeline, setTimeline] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (orderId) {
            fetchTimeline();
        }
    }, [orderId]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/timeline/orders/${orderId}`);
            setTimeline(res.data.timeline || []);
            setSummary(res.data.summary || []);
            
            const total = res.data.timeline?.length || 0;
            const completed = res.data.timeline?.filter(t => t.status === 'COMPLETED' || t.status === 'DELIVERED').length || 0;
            const inProgress = res.data.timeline?.filter(t => 
                t.status !== 'COMPLETED' && t.status !== 'DELIVERED' && t.status !== 'CANCELLED'
            ).length || 0;
            const pending = res.data.timeline?.filter(t => t.status === 'PENDING').length || 0;
            
            setStats({ total, completed, inProgress, pending });
        } catch (error) {
            toast.error('Failed to load timeline');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    };

    const getStatusProgress = (currentStatus) => {
        const index = STATUS_ORDER.indexOf(currentStatus);
        if (index === -1) return 0;
        return ((index + 1) / STATUS_ORDER.length) * 100;
    };

    const formatTimeAgo = (date) => {
        const diff = new Date() - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    // Group timeline by product
    const groupedByProduct = timeline.reduce((acc, entry) => {
        const key = entry.product_id || 'unknown';
        if (!acc[key]) {
            acc[key] = {
                product_id: key,
                product_name: entry.product_name || 'Unknown Product',
                product_category: entry.product_category || 'Uncategorized',
                order_quantity: entry.order_quantity || 1,
                entries: []
            };
        }
        acc[key].entries.push(entry);
        return acc;
    }, {});

    const productGroups = Object.values(groupedByProduct);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No timeline entries yet</p>
                <p className="text-xs">Timeline will appear once production starts</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-yellow-600">Pending</p>
                        <p className="text-sm font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-600">In Progress</p>
                        <p className="text-sm font-bold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600">Completed</p>
                        <p className="text-sm font-bold text-green-600">{stats.completed}</p>
                    </div>
                </div>
            )}

            {/* Product Timeline Groups */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {productGroups.map((group, index) => {
                    const latestStatus = group.entries[group.entries.length - 1]?.status || 'PENDING';
                    const statusConfig = getStatusConfig(latestStatus);
                    const StatusIcon = statusConfig.icon;
                    const progress = getStatusProgress(latestStatus);
                    const isExpanded = expandedProduct === group.product_id;

                    return (
                        <motion.div
                            key={group.product_id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                            {/* Product Header */}
                            <div 
                                className="p-3 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between"
                                onClick={() => setExpandedProduct(isExpanded ? null : group.product_id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`p-1.5 rounded-lg ${statusConfig.bgColor}`}>
                                        <StatusIcon className={`h-4 w-4 ${statusConfig.textColor}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm text-gray-800">{group.product_name}</p>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                {group.product_category}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Qty: {group.order_quantity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className={`text-xs font-medium ${statusConfig.textColor}`}>
                                                {statusConfig.label}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatTimeAgo(group.entries[group.entries.length - 1]?.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-20">
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div 
                                                className={`h-1.5 rounded-full transition-all duration-500 ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Timeline Entries */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="border-t border-gray-100"
                                    >
                                        <div className="p-3">
                                            <div className="space-y-0">
                                                {group.entries.map((entry, idx) => {
                                                    const entryStatus = getStatusConfig(entry.status);
                                                    const EntryIcon = entryStatus.icon;
                                                    const isLast = idx === group.entries.length - 1;
                                                    const isCompleted = entry.status === 'COMPLETED' || entry.status === 'DELIVERED';

                                                    return (
                                                        <div key={entry.id || idx} className="relative">
                                                            {!isLast && (
                                                                <div className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                                                            )}
                                                            
                                                            <div className="flex gap-3 pb-4">
                                                                <div className="flex-shrink-0 z-10">
                                                                    <div className={`w-7 h-7 rounded-full ${entryStatus.bgColor} ${entryStatus.textColor} flex items-center justify-center border-2 ${isCompleted ? 'border-green-300' : 'border-gray-200'}`}>
                                                                        <EntryIcon className="h-3.5 w-3.5" />
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 pt-0.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-medium text-xs text-gray-800">
                                                                                {entryStatus.label}
                                                                            </p>
                                                                            <span className="text-xs text-gray-400">
                                                                                {formatTimeAgo(entry.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        {entry.estimated_completion && (
                                                                            <span className="text-xs text-gray-400">
                                                                                Est: {new Date(entry.estimated_completion).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {entry.description && (
                                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                                            {entry.description}
                                                                        </p>
                                                                    )}
                                                                    
                                                                    {entry.location && (
                                                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />
                                                                            {entry.location}
                                                                        </p>
                                                                    )}
                                                                    
                                                                    {entry.created_by_name && (
                                                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                                            <User className="h-3 w-3" />
                                                                            {entry.created_by_name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            {/* Refresh Button */}
            <div className="flex justify-center pt-1">
                <button
                    onClick={fetchTimeline}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>
        </div>
    );
};

// =====================================================
// HELPERS
// =====================================================
const getStatusBadge = (status) => {
    const statusMap = {
        'Pending': { bg: 'bg-gray-100', text: 'text-gray-700', icon: <Clock size={12} /> },
        'Production': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <Package size={12} /> },
        'Dispatched': { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Truck size={12} /> },
        'Delivered': { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCircle size={12} /> },
        'Cancelled': { bg: 'bg-red-100', text: 'text-red-700', icon: <X size={12} /> }
    };
    return statusMap[status] || statusMap['Pending'];
};

const getPaymentBadge = (status) => {
    const statusMap = {
        'Paid': 'bg-green-100 text-green-700',
        'Partial': 'bg-yellow-100 text-yellow-700',
        'Unpaid': 'bg-red-100 text-red-700'
    };
    return statusMap[status] || statusMap['Unpaid'];
};

const getPriorityBadge = (priority) => {
    const priorityMap = {
        'Urgent': 'bg-red-100 text-red-700',
        'Normal': 'bg-blue-100 text-blue-700',
        'Low': 'bg-gray-100 text-gray-700'
    };
    return priorityMap[priority] || priorityMap['Normal'];
};

const getPaymentMethodBadge = (method) => {
    const methodMap = {
        'Cash': { icon: <Banknote className="h-3 w-3" />, bg: 'bg-green-100 text-green-700' },
        'Credit Card': { icon: <CreditCardIcon className="h-3 w-3" />, bg: 'bg-blue-100 text-blue-700' },
        'Debit Card': { icon: <CreditCardIcon className="h-3 w-3" />, bg: 'bg-indigo-100 text-indigo-700' },
        'EFT': { icon: <Building className="h-3 w-3" />, bg: 'bg-purple-100 text-purple-700' },
        'Mobile Payment': { icon: <Smartphone className="h-3 w-3" />, bg: 'bg-orange-100 text-orange-700' },
        'Invoice': { icon: <FileText className="h-3 w-3" />, bg: 'bg-gray-100 text-gray-700' }
    };
    return methodMap[method] || { icon: <Wallet className="h-3 w-3" />, bg: 'bg-gray-100 text-gray-700' };
};

// =====================================================
// MAIN ORDERS COMPONENT
// =====================================================
export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
    const [analyticsData, setAnalyticsData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        statusBreakdown: [],
        paymentBreakdown: [],
        revenueByStatus: []
    });
    const [newOrder, setNewOrder] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        customer_address: '',
        delivery_address: '',
        delivery_date: '',
        delivery_time_slot: '',
        priority: 'Normal',
        notes: '',
        payment_method: 'Cash',
        requires_delivery: false,
        items: []
    });
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        company: '',
        notes: ''
    });
    const [newItem, setNewItem] = useState({
        product_id: '',
        quantity: 1,
        unit_price: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStatusUpdate, setShowStatusUpdate] = useState(false);
    const [selectedOrderStatus, setSelectedOrderStatus] = useState(null);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [customers, setCustomers] = useState([
        { id: 1, name: 'ABC Construction', phone: '011-555-1001', email: 'info@abcconstruction.co.za', address: '123 Builder Ave, Sandton', company: 'ABC Construction', orders: 12, totalSpent: 45000, status: 'Active', joinDate: '2024-01-15' },
        { id: 2, name: 'XYZ Developers', phone: '011-555-1002', email: 'projects@xyzdevelopers.co.za', address: '789 Park St, Rosebank', company: 'XYZ Developers', orders: 8, totalSpent: 28000, status: 'Active', joinDate: '2024-02-20' },
        { id: 3, name: 'PTA Builders', phone: '012-555-1003', email: 'info@ptabuilders.co.za', address: '456 Church St, Pretoria', company: 'PTA Builders', orders: 5, totalSpent: 15000, status: 'Active', joinDate: '2024-03-10' },
        { id: 4, name: 'JHB Construction', phone: '011-555-1004', email: 'projects@jhbconstruction.co.za', address: '321 Main Rd, Randburg', company: 'JHB Construction', orders: 3, totalSpent: 8200, status: 'Inactive', joinDate: '2024-04-05' },
        { id: 5, name: 'Sandton Projects', phone: '011-555-1005', email: 'info@sandtonprojects.co.za', address: '789 Sandton Dr, Sandton', company: 'Sandton Projects', orders: 6, totalSpent: 21000, status: 'Active', joinDate: '2024-05-12' },
    ]);

    // Payment method options
    const paymentMethods = [
        { value: 'Cash', label: 'Cash', icon: <Banknote className="h-4 w-4" /> },
        { value: 'Credit Card', label: 'Credit Card', icon: <CreditCardIcon className="h-4 w-4" /> },
        { value: 'Debit Card', label: 'Debit Card', icon: <CreditCardIcon className="h-4 w-4" /> },
        { value: 'EFT', label: 'EFT (Bank Transfer)', icon: <Building className="h-4 w-4" /> },
        { value: 'Mobile Payment', label: 'Mobile Payment', icon: <Smartphone className="h-4 w-4" /> },
        { value: 'Invoice', label: 'Invoice (30 days)', icon: <FileText className="h-4 w-4" /> }
    ];

    // Sales Report State
    const [salesReportPeriod, setSalesReportPeriod] = useState('weekly');
    const [salesReportData, setSalesReportData] = useState([]);
    const [salesReportStats, setSalesReportStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        growth: 0,
        revenueData: [],
        orderData: [],
        topProducts: [],
        categoryBreakdown: []
    });
    const [salesReportLoading, setSalesReportLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchProducts();
        fetchAnalytics();
        generateSalesReport('weekly');
    }, []);

    const refreshTable = () => {
        setTableRefreshKey(prev => prev + 1);
        fetchOrders();
        fetchAnalytics();
        generateSalesReport(salesReportPeriod);
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/api/orders');
            const parsedOrders = parseOrders(res.data);
            setOrders(parsedOrders);
        } catch (error) {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            const parsedProducts = res.data.map(product => ({
                ...product,
                unit_price: parseNumber(product.unit_price),
                stock_quantity: parseInt(product.stock_quantity) || 0
            }));
            setProducts(parsedProducts);
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const sampleData = generateSampleAnalytics();
            setAnalyticsData(sampleData);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        }
    };

    const generateSampleAnalytics = () => {
        const statuses = ['Pending', 'Production', 'Dispatched', 'Delivered', 'Cancelled'];
        const paymentStatuses = ['Paid', 'Partial', 'Unpaid'];
        
        const generateTimeData = (count) => {
            return Array.from({ length: count }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (count - i));
                return {
                    date: date.toISOString().split('T')[0],
                    label: date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }),
                    revenue: Math.round((Math.random() * 15000 + 1000) * 100) / 100,
                    orders: Math.round(Math.random() * 20 + 2),
                    averageOrderValue: Math.round((Math.random() * 500 + 100) * 100) / 100
                };
            });
        };

        return {
            daily: generateTimeData(30),
            weekly: generateTimeData(12),
            monthly: Array.from({ length: 12 }, (_, i) => ({
                label: new Date(2024, i, 1).toLocaleDateString('en-ZA', { month: 'short' }),
                revenue: Math.round((Math.random() * 80000 + 10000) * 100) / 100,
                orders: Math.round(Math.random() * 100 + 20)
            })),
            statusBreakdown: statuses.map(status => ({
                name: status,
                value: Math.round(Math.random() * 40 + 5)
            })),
            paymentBreakdown: paymentStatuses.map(status => ({
                name: status,
                value: Math.round(Math.random() * 40 + 5)
            })),
            revenueByStatus: statuses.map(status => ({
                name: status,
                value: Math.round((Math.random() * 30000 + 1000) * 100) / 100
            }))
        };
    };

    // =====================================================
    // GENERATE SALES REPORT DATA
    // =====================================================
    const generateSalesReport = (period) => {
        setSalesReportLoading(true);
        
        // Get date range based on period
        const now = new Date();
        let count = 0;
        let labelFormat = '';

        switch(period) {
            case 'daily':
                count = 30; // Last 30 days
                labelFormat = 'MMM D';
                break;
            case 'weekly':
                count = 12; // Last 12 weeks
                labelFormat = 'MMM D';
                break;
            case 'monthly':
                count = 12; // Last 12 months
                labelFormat = 'MMM YYYY';
                break;
            case 'yearly':
                count = 5; // Last 5 years
                labelFormat = 'YYYY';
                break;
            default:
                count = 12;
                labelFormat = 'MMM YYYY';
        }

        // Generate date range
        const dateRange = Array.from({ length: count }, (_, i) => {
            const d = new Date(now);
            if (period === 'daily') d.setDate(d.getDate() - (count - 1 - i));
            else if (period === 'weekly') d.setDate(d.getDate() - (count - 1 - i) * 7);
            else if (period === 'monthly') d.setMonth(d.getMonth() - (count - 1 - i));
            else if (period === 'yearly') d.setFullYear(d.getFullYear() - (count - 1 - i));
            return d;
        });

        // Generate data with realistic patterns
        const generatedData = dateRange.map((date, index) => {
            // Base revenue with seasonal pattern
            const dayOfMonth = date.getDate();
            const month = date.getMonth();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            // Seasonal factors
            const seasonalFactor = 1 + 0.3 * Math.sin((month / 12) * 2 * Math.PI);
            const weekendFactor = isWeekend ? 0.7 : 1;
            const trendFactor = 1 + (index / count) * 0.2 + (Math.random() * 0.1 - 0.05);
            
            const baseRevenue = 8000 + Math.random() * 30000;
            const revenue = baseRevenue * seasonalFactor * weekendFactor * trendFactor;
            const orders = Math.round((8 + Math.random() * 45) * seasonalFactor * weekendFactor * trendFactor);
            const avgValue = revenue / orders;
            
            let label;
            if (period === 'daily' || period === 'weekly') {
                label = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
            } else if (period === 'monthly') {
                label = date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
            } else {
                label = date.getFullYear().toString();
            }
            
            return {
                label,
                fullDate: date,
                revenue: Math.round(revenue * 100) / 100,
                orders: orders,
                avgOrderValue: Math.round(avgValue * 100) / 100,
                profit: Math.round(revenue * 0.35 * 100) / 100
            };
        });

        // Calculate summary stats
        const totalRevenue = generatedData.reduce((sum, d) => sum + d.revenue, 0);
        const totalOrders = generatedData.reduce((sum, d) => sum + d.orders, 0);
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Calculate growth
        const midPoint = Math.floor(generatedData.length / 2);
        const firstHalf = generatedData.slice(0, midPoint);
        const secondHalf = generatedData.slice(midPoint);
        const firstAvg = firstHalf.reduce((s, d) => s + d.revenue, 0) / (firstHalf.length || 1);
        const secondAvg = secondHalf.reduce((s, d) => s + d.revenue, 0) / (secondHalf.length || 1);
        const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0;

        // Generate top products (sample data based on orders)
        const productNames = ['Standard Brick', 'Face Brick', 'Cement 50kg', 'River Sand', 'Paving Block', 'Premium Brick', 'Concrete Block'];
        const topProducts = productNames.map((name) => ({
            name,
            revenue: Math.round((12000 + Math.random() * 48000) * 100) / 100,
            orders: Math.round(20 + Math.random() * 80),
            growth: Math.round((Math.random() * 50 - 15) * 10) / 10
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

        // Category breakdown
        const categories = ['Bricks', 'Cement', 'Aggregates', 'Blocks', 'Stone', 'Sand'];
        const categoryBreakdown = categories.map(name => ({
            name,
            value: Math.round((5000 + Math.random() * 30000) * 100) / 100
        })).sort((a, b) => b.value - a.value);

        setSalesReportData(generatedData);
        setSalesReportStats({
            totalRevenue,
            totalOrders,
            avgOrderValue,
            growth,
            revenueData: generatedData,
            orderData: generatedData,
            topProducts,
            categoryBreakdown
        });
        setSalesReportLoading(false);
    };

    // Handle period change
    const handlePeriodChange = (period) => {
        setSalesReportPeriod(period);
        generateSalesReport(period);
    };

    // jsPDF and its autotable plugin are ~670 KB - larger than the rest of the
    // app put together, and only needed the moment someone actually exports an
    // invoice. Loading them on demand keeps that weight off every page load.
    const generateInvoicePDF = async (order) => {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);

        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.setTextColor('#1a56db');
        doc.text('BRICKKERB CRETE', 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor('#666');
        doc.text('123 Brickfield Road, Benoni, Gauteng', 14, 28);
        doc.text('Tel: 011 555 0000 | Email: info@brickkerb.co.za', 14, 33);
        doc.text('VAT Registration: 1234567890', 14, 38);
        
        doc.setDrawColor('#ddd');
        doc.line(14, 42, 196, 42);
        
        doc.setFontSize(16);
        doc.setTextColor('#000');
        doc.text('TAX INVOICE', 14, 52);
        
        doc.setFontSize(10);
        doc.setTextColor('#333');
        doc.text(`Invoice #: INV-${String(order.id).padStart(6, '0')}`, 14, 62);
        doc.text(`Date: ${new Date(order.order_date).toLocaleDateString()}`, 14, 68);
        doc.text(`Status: ${order.status}`, 14, 74);
        doc.text(`Payment Method: ${order.payment_method || 'N/A'}`, 14, 80);
        
        doc.setFontSize(11);
        doc.setTextColor('#000');
        doc.text('Bill To:', 14, 92);
        doc.setFontSize(10);
        doc.setTextColor('#333');
        doc.text(order.customer_name, 14, 99);
        if (order.customer_address) {
            doc.text(order.customer_address, 14, 105);
        }
        doc.text(`Phone: ${order.customer_phone || 'N/A'}`, 14, 111);
        doc.text(`Email: ${order.customer_email || 'N/A'}`, 14, 117);
        
        const totalAmount = parseNumber(order.total_amount);
        const paidAmount = parseNumber(order.paid_amount);
        
        const tableData = order.items?.map(item => [
            item.product_name || `Product #${item.product_id}`,
            item.quantity,
            `R${parseNumber(item.unit_price).toFixed(2)}`,
            `R${parseNumber(item.total).toFixed(2)}`
        ]) || [];
        
        autoTable(doc, {
            startY: 126,
            head: [['Description', 'Qty', 'Unit Price', 'Total']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [26, 86, 219], textColor: [255, 255, 255] },
            foot: [
                [{ content: 'Subtotal:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                 '', { content: `R${totalAmount.toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }],
                [{ content: 'VAT (15%):', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } },
                 '', { content: `R${(totalAmount * 0.15).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold' } }],
                [{ content: 'TOTAL DUE:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [26, 86, 219], textColor: [255, 255, 255] } },
                 '', { content: `R${(totalAmount * 1.15).toFixed(2)}`, styles: { halign: 'right', fontStyle: 'bold', fillColor: [26, 86, 219], textColor: [255, 255, 255] } }],
                [{ content: `Amount Paid: R${paidAmount.toFixed(2)}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] } }],
                [{ content: `Balance Due: R${(totalAmount - paidAmount).toFixed(2)}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'bold', textColor: [239, 68, 68] } }],
                [{ content: `Payment Method: ${order.payment_method || 'N/A'}`, colSpan: 4, styles: { halign: 'right', fontStyle: 'italic', textColor: [100, 100, 100] } }]
            ]
        });
        
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setTextColor('#999');
        doc.text('Thank you for your business!', 14, finalY);
        doc.text('Payment terms: 30 days from invoice date', 14, finalY + 5);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, finalY + 10);
        
        doc.save(`Invoice_INV-${String(order.id).padStart(6, '0')}.pdf`);
        toast.success('Invoice downloaded successfully!');
    };

    const viewOrderDetails = async (orderId) => {
        try {
            const res = await axios.get(`/api/orders/${orderId}`);
            const order = res.data;
            order.total_amount = parseNumber(order.total_amount);
            order.paid_amount = parseNumber(order.paid_amount);
            if (order.items) {
                order.items = order.items.map(item => ({
                    ...item,
                    unit_price: parseNumber(item.unit_price),
                    total: parseNumber(item.total)
                }));
            }
            setSelectedOrder(order);
            setShowModal(true);
        } catch (error) {
            toast.error('Failed to load order details');
        }
    };

    const handleAddItem = () => {
        if (!newItem.product_id || newItem.quantity <= 0) {
            toast.error('Please select a product and enter quantity');
            return;
        }
        const product = products.find(p => p.id === parseInt(newItem.product_id));
        const unitPrice = parseNumber(newItem.unit_price) || product?.unit_price || 0;
        const quantity = parseInt(newItem.quantity) || 1;
        
        setNewOrder({
            ...newOrder,
            items: [
                ...newOrder.items,
                {
                    product_id: parseInt(newItem.product_id),
                    product_name: product?.name || 'Unknown Product',
                    quantity: quantity,
                    unit_price: unitPrice,
                    total: quantity * unitPrice
                }
            ]
        });
        setNewItem({ product_id: '', quantity: 1, unit_price: 0 });
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...newOrder.items];
        updatedItems.splice(index, 1);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    // =====================================================
    // CREATE ORDER WITH AUTOMATIC DELIVERY CREATION
    // =====================================================
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (newOrder.items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }
        setIsSubmitting(true);
        try {
            // 1. Create the order
            const orderData = {
                ...newOrder,
                items: newOrder.items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price
                }))
            };
            
            const orderResponse = await axios.post('/api/orders', orderData);
            const createdOrder = orderResponse.data;
            
            // 2. If delivery is required, automatically create a delivery record
            if (newOrder.requires_delivery && createdOrder.id) {
                try {
                    // Calculate pallets for the first item (or sum of all items)
                    const totalQuantity = newOrder.items.reduce((sum, item) => sum + item.quantity, 0);
                    const firstProduct = products.find(p => p.id === newOrder.items[0]?.product_id);
                    const pallets = calculatePallets(totalQuantity, firstProduct?.name);
                    
                    const deliveryData = {
                        order_id: createdOrder.id,
                        customer_name: newOrder.customer_name,
                        customer_phone: newOrder.customer_phone,
                        customer_address: newOrder.delivery_address || newOrder.customer_address,
                        product_name: newOrder.items.map(item => 
                            products.find(p => p.id === item.product_id)?.name || 'Product'
                        ).join(', '),
                        product_color: '', // Will be set based on product
                        quantity: totalQuantity,
                        pallets: pallets,
                        order_date: new Date().toISOString().split('T')[0],
                        delivery_date: newOrder.delivery_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: 'Pending',
                        notes: `Auto-created from Order #${createdOrder.id}`
                    };
                    
                    await axios.post('/api/deliveries', deliveryData);
                    toast.success('Order created and delivery scheduled successfully!');
                } catch (deliveryError) {
                    console.error('Failed to create delivery:', deliveryError);
                    toast.warning('Order created but delivery scheduling failed. Please create delivery manually.');
                }
            } else {
                toast.success('Order created successfully!');
            }
            
            setShowCreateModal(false);
            setNewOrder({
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                customer_address: '',
                delivery_address: '',
                delivery_date: '',
                delivery_time_slot: '',
                priority: 'Normal',
                notes: '',
                payment_method: 'Cash',
                requires_delivery: false,
                items: []
            });
            refreshTable();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCustomer = (e) => {
        e.preventDefault();
        const newCustomerData = {
            id: customers.length + 1,
            ...newCustomer,
            orders: 0,
            totalSpent: 0,
            status: 'Active',
            joinDate: new Date().toISOString().split('T')[0]
        };
        setCustomers([...customers, newCustomerData]);
        toast.success('Customer added successfully!');
        setShowCustomerModal(false);
        setNewCustomer({
            name: '',
            phone: '',
            email: '',
            address: '',
            company: '',
            notes: ''
        });
    };

    const calculateTotal = () => {
        return newOrder.items.reduce((sum, item) => sum + parseNumber(item.total), 0);
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await axios.patch(`/api/orders/${orderId}/status`, { status });
            toast.success(`Order status updated to ${status}`);
            setShowStatusUpdate(false);
            refreshTable();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const tabs = [
        { id: 'list', label: 'Orders', icon: <List size={16} /> },
        { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
        { id: 'sales-report', label: 'Sales Report', icon: <LineChart size={16} /> },
        { id: 'insights', label: 'Insights', icon: <TrendingUp size={16} /> }
    ];

    // Summary statistics
    const summary = useMemo(() => {
        if (!orders || orders.length === 0) {
            return { total: 0, pending: 0, inProgress: 0, delivered: 0, revenue: 0 };
        }
        
        const total = orders.length;
        const pending = orders.filter(o => o.status === 'Pending').length;
        const inProgress = orders.filter(o => o.status === 'Production' || o.status === 'Dispatched').length;
        const delivered = orders.filter(o => o.status === 'Delivered').length;
        const revenue = orders.reduce((sum, o) => sum + parseNumber(o.total_amount), 0);
        
        return { total, pending, inProgress, delivered, revenue };
    }, [orders]);

    const periodOptions = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'yearly', label: 'Yearly' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             o.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
    });

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
                        <ShoppingCart className="h-7 w-7 mr-2 text-blue-500" />
                        Orders & Customers
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage orders, customers, and track performance
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={refreshTable}
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCustomerModal(true)}
                        className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Customer
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

            {/* ===================================================== */}
            {/* ORDERS LIST TAB */}
            {/* ===================================================== */}
            {activeTab === 'list' ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                >
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                        {[
                            { icon: ShoppingCart, color: 'blue', label: 'Total Orders', value: summary.total, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                            { icon: Clock, color: 'yellow', label: 'Pending', value: summary.pending, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
                            { icon: Package, color: 'purple', label: 'In Progress', value: summary.inProgress, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                            { icon: CheckCircle, color: 'green', label: 'Delivered', value: summary.delivered, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                            { icon: DollarSign, color: 'green', label: 'Total Revenue', value: formatCurrency(summary.revenue), bgColor: 'bg-green-100', iconColor: 'text-green-600' }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                custom={index}
                                variants={statsCardVariants}
                                whileHover="hover"
                                className="rounded-lg bg-white p-6 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center">
                                    <div className={`rounded-lg ${stat.bgColor} p-3`}>
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                            <div className="relative flex-1 max-w-lg">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Search orders..."
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Production">Production</option>
                                        <option value="Dispatched">Dispatched</option>
                                        <option value="Delivered">Delivered</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                    <select
                                        value={paymentFilter}
                                        onChange={(e) => setPaymentFilter(e.target.value)}
                                        className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="all">All Payments</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Unpaid">Unpaid</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setPaymentFilter('all');
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>
                                            <div className="flex items-center">
                                                Order #
                                                {sortConfig.key === 'id' && (
                                                    sortConfig.direction === 'asc' ? 
                                                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                                                        <ChevronDown className="h-4 w-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customer_name')}>
                                            <div className="flex items-center">
                                                Customer
                                                {sortConfig.key === 'customer_name' && (
                                                    sortConfig.direction === 'asc' ? 
                                                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                                                        <ChevronDown className="h-4 w-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('order_date')}>
                                            <div className="flex items-center">
                                                Date
                                                {sortConfig.key === 'order_date' && (
                                                    sortConfig.direction === 'asc' ? 
                                                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                                                        <ChevronDown className="h-4 w-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_amount')}>
                                            <div className="flex items-center justify-end">
                                                Amount
                                                {sortConfig.key === 'total_amount' && (
                                                    sortConfig.direction === 'asc' ? 
                                                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                                                        <ChevronDown className="h-4 w-4 ml-1" />
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                                                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-medium">No orders found</p>
                                                <p className="text-xs">Try adjusting your filters or create a new order</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order, index) => {
                                            const statusBadge = getStatusBadge(order.status);
                                            const paymentBadge = getPaymentBadge(order.payment_status);
                                            const priorityBadge = getPriorityBadge(order.priority);
                                            const paymentMethod = getPaymentMethodBadge(order.payment_method);
                                            return (
                                                <motion.tr 
                                                    key={`${order.id}-${tableRefreshKey}`}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    className="hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                                                            <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            <p>{new Date(order.order_date).toLocaleDateString()}</p>
                                                            <p className="text-xs">{new Date(order.order_date).toLocaleTimeString()}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                        {formatCurrency(order.total_amount)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentMethod.bg}`}>
                                                            {paymentMethod.icon}
                                                            {order.payment_method || 'Cash'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                            {statusBadge.icon}
                                                            <span className="ml-1">{order.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentBadge}`}>
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityBadge}`}>
                                                            {order.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => viewOrderDetails(order.id)}
                                                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => {
                                                                    setSelectedOrderStatus(order);
                                                                    setShowStatusUpdate(true);
                                                                }}
                                                                className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                                                title="Update Status"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.1 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => generateInvoicePDF(order)}
                                                                className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                                title="Download Invoice"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
                            <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                            <span>Total Revenue: <strong className="text-green-600">{formatCurrency(summary.revenue)}</strong></span>
                        </div>
                    </div>
                </motion.div>
            ) : activeTab === 'customers' ? (
                /* ===================================================== */
                /* CUSTOMERS TAB */
                /* ===================================================== */
                <CustomerTable
                    customers={customers}
                    onViewOrders={(customer) => {
                        setSearchQuery(customer.name);
                        setActiveTab('list');
                    }}
                    onCreateOrder={(customer) => {
                        setNewOrder({
                            ...newOrder,
                            customer_name: customer.name,
                            customer_phone: customer.phone,
                            customer_email: customer.email,
                            customer_address: customer.address
                        });
                        setShowCreateModal(true);
                    }}
                    onEdit={(customer) => {
                        toast.info(`Edit customer: ${customer.name}`);
                    }}
                    onDelete={(id) => {
                        setCustomers(customers.filter(c => c.id !== id));
                        toast.success('Customer deleted successfully');
                    }}
                    onAddCustomer={() => setShowCustomerModal(true)}
                />
            ) : activeTab === 'analytics' ? (
                /* ===================================================== */
                /* ANALYTICS TAB */
                /* ===================================================== */
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: DollarSign, color: 'blue', label: 'Total Revenue', value: formatCurrency(summary.revenue), bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                            { icon: ShoppingCart, color: 'purple', label: 'Total Orders', value: summary.total, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                            { icon: TrendingUp, color: 'green', label: 'Avg Order Value', value: summary.total > 0 ? formatCurrency(summary.revenue / summary.total) : 'R0.00', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                            { icon: CheckCircle, color: 'green', label: 'Completion Rate', value: summary.total > 0 ? `${Math.round(summary.delivered / summary.total * 100)}%` : '0%', bgColor: 'bg-green-100', iconColor: 'text-green-600' }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                custom={index}
                                variants={statsCardVariants}
                                whileHover="hover"
                                className="rounded-lg bg-white p-6 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center">
                                    <div className={`rounded-lg ${stat.bgColor} p-3`}>
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                Revenue by Status
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={analyticsData.revenueByStatus}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Bar dataKey="value" fill="#3b82f6" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <PieChart className="h-4 w-4 text-purple-500" />
                                Order Status Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <RePieChart>
                                    <Pie
                                        data={analyticsData.statusBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analyticsData.statusBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-green-500" />
                                Revenue Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <ReLineChart data={analyticsData.daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                                </ReLineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-orange-500" />
                                Payment Status Breakdown
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <RePieChart>
                                    <Pie
                                        data={analyticsData.paymentBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {analyticsData.paymentBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            ) : activeTab === 'sales-report' ? (
                /* ===================================================== */
                /* SALES REPORT TAB */
                /* ===================================================== */
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                >
                    {/* Sales Report Stats */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: DollarSign, color: 'blue', label: 'Total Revenue', value: formatCurrency(salesReportStats.totalRevenue), bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                            { icon: ShoppingCart, color: 'purple', label: 'Total Orders', value: salesReportStats.totalOrders, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                            { icon: TrendingUp, color: 'green', label: 'Avg Order Value', value: formatCurrency(salesReportStats.avgOrderValue), bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                            { icon: Activity, color: 'orange', label: 'Growth Rate', value: `${salesReportStats.growth >= 0 ? '+' : ''}${salesReportStats.growth.toFixed(1)}%`, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' }
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                custom={index}
                                variants={statsCardVariants}
                                whileHover="hover"
                                className="rounded-lg bg-white p-6 shadow-sm border border-gray-200"
                            >
                                <div className="flex items-center">
                                    <div className={`rounded-lg ${stat.bgColor} p-3`}>
                                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Period Filters */}
                    <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">Period:</span>
                                {periodOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handlePeriodChange(option.id)}
                                        className={`px-4 py-2 text-sm rounded-lg transition-all ${
                                            salesReportPeriod === option.id
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
                                onClick={() => generateSalesReport(salesReportPeriod)}
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

                    {salesReportLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
                            {/* Revenue & Orders Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-blue-500" />
                                        Revenue Trend ({salesReportPeriod.charAt(0).toUpperCase() + salesReportPeriod.slice(1)})
                                    </h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <ComposedChart data={salesReportData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="label" />
                                            <YAxis />
                                            <Tooltip 
                                                formatter={(value, name) => {
                                                    if (name === 'revenue' || name === 'profit') {
                                                        return [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Profit'];
                                                    }
                                                    return [value, name];
                                                }}
                                                labelFormatter={(label) => `Period: ${label}`}
                                            />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <LineChart className="h-4 w-4 text-purple-500" />
                                        Orders & Average Order Value
                                    </h3>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <ComposedChart data={salesReportData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="label" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip 
                                                formatter={(value, name) => {
                                                    if (name === 'Orders') {
                                                        return [value, 'Orders'];
                                                    }
                                                    if (name === 'Avg Order Value') {
                                                        return [formatCurrency(value), 'Avg Order Value'];
                                                    }
                                                    if (name === 'orders') {
                                                        return [value, 'Orders'];
                                                    }
                                                    if (name === 'avgOrderValue') {
                                                        return [formatCurrency(value), 'Avg Order Value'];
                                                    }
                                                    return [formatCurrency(value), name];
                                                }}
                                                labelFormatter={(label) => `Period: ${label}`}
                                            />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="orders" fill="#8b5cf6" name="Orders" radius={[4, 4, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#f59e0b" name="Avg Order Value" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Products & Category Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                        Top Products by Revenue
                                    </h3>
                                    <div className="space-y-3">
                                        {salesReportStats.topProducts.slice(0, 6).map((product, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
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
                                                        <p className="font-medium text-sm">{product.name}</p>
                                                        <p className="text-xs text-gray-400">{product.orders} orders</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm text-blue-600">{formatCurrency(product.revenue)}</p>
                                                    <p className={`text-xs ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {product.growth >= 0 ? '+' : ''}{product.growth.toFixed(1)}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <PieChart className="h-4 w-4 text-purple-500" />
                                        Revenue by Category
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <RePieChart>
                                                <Pie
                                                    data={salesReportStats.categoryBreakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                    outerRadius={70}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {salesReportStats.categoryBreakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-col justify-center gap-2">
                                            {salesReportStats.categoryBreakdown.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        <span className="text-sm font-medium">{item.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-blue-600">{formatCurrency(item.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Sales Data Table */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-500" />
                                        Sales Data ({salesReportPeriod.charAt(0).toUpperCase() + salesReportPeriod.slice(1)})
                                    </h3>
                                    <span className="text-xs text-gray-400">{salesReportData.length} records</span>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr className="text-left text-gray-500">
                                                <th className="px-4 py-2 font-medium">Period</th>
                                                <th className="px-4 py-2 font-medium text-right">Revenue</th>
                                                <th className="px-4 py-2 font-medium text-right">Orders</th>
                                                <th className="px-4 py-2 font-medium text-right">Avg Order Value</th>
                                                <th className="px-4 py-2 font-medium text-right">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {salesReportData.slice().reverse().map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition">
                                                    <td className="px-4 py-2 text-gray-700">{item.label}</td>
                                                    <td className="px-4 py-2 text-right font-medium text-blue-600">{formatCurrency(item.revenue)}</td>
                                                    <td className="px-4 py-2 text-right">{item.orders}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(item.avgOrderValue)}</td>
                                                    <td className="px-4 py-2 text-right text-green-600">{formatCurrency(item.profit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50 font-semibold">
                                            <tr>
                                                <td className="px-4 py-2">Total</td>
                                                <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(salesReportStats.totalRevenue)}</td>
                                                <td className="px-4 py-2 text-right">{salesReportStats.totalOrders}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(salesReportStats.avgOrderValue)}</td>
                                                <td className="px-4 py-2 text-right text-green-600">{formatCurrency(salesReportStats.totalRevenue * 0.35)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            ) : (
                /* ===================================================== */
                /* INSIGHTS TAB */
                /* ===================================================== */
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Revenue Growth</p>
                                <p className="text-xl font-bold text-green-600">+12.5%</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Compared to last month, revenue has increased by 12.5% driven by higher order volume.</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-yellow-100 rounded-xl">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average Delivery Time</p>
                                <p className="text-xl font-bold">2.3 days</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Average delivery time has improved by 15% compared to last month.</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Package className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Top Product Category</p>
                                <p className="text-xl font-bold">Bricks</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Bricks account for 45% of all orders. Consider increasing stock levels.</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-xl">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending Orders</p>
                                <p className="text-xl font-bold text-red-600">{summary.pending}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Orders pending processing require immediate attention.</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <DollarSign className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unpaid Invoices</p>
                                <p className="text-xl font-bold text-red-600">
                                    {formatCurrency(orders.filter(o => o.payment_status === 'Unpaid').reduce((sum, o) => sum + parseNumber(o.total_amount), 0))}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Total outstanding payments that need to be collected.</p>
                    </div>

                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-teal-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Customer Satisfaction</p>
                                <p className="text-xl font-bold text-green-600">94%</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">Based on delivery success rate and payment completion.</p>
                    </div>
                </motion.div>
            )}

            {/* ===================================================== */}
            {/* ORDER DETAILS MODAL WITH TIMELINE */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showModal && selectedOrder && (
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
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-xl font-bold text-gray-900">Order #{selectedOrder.id}</h2>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                                                    {getStatusBadge(selectedOrder.status).icon}
                                                    <span className="ml-1">{selectedOrder.status}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{selectedOrder.customer_name}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm p-4 bg-gray-50 rounded-lg mb-4">
                                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /> {new Date(selectedOrder.order_date).toLocaleString()}</div>
                                        <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" /> {selectedOrder.payment_status}</div>
                                        <div className="flex items-center gap-2"><span className="font-medium">Total:</span> {formatCurrency(selectedOrder.total_amount)}</div>
                                        <div className="flex items-center gap-2"><span className="font-medium">Payment:</span> {selectedOrder.payment_method || 'Cash'}</div>
                                    </div>

                                    {selectedOrder.customer_address && (
                                        <div className="mb-4 text-sm p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">Customer Address:</span> {selectedOrder.customer_address}
                                        </div>
                                    )}
                                    {selectedOrder.delivery_address && (
                                        <div className="mb-4 text-sm p-3 bg-gray-50 rounded-lg">
                                            <span className="font-medium">Delivery Address:</span> {selectedOrder.delivery_address}
                                        </div>
                                    )}

                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-500" />
                                        Order Items
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left py-2 px-3">Product</th>
                                                    <th className="text-right py-2 px-3">Qty</th>
                                                    <th className="text-right py-2 px-3">Unit Price</th>
                                                    <th className="text-right py-2 px-3">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items?.map((item, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        <td className="py-2 px-3">{item.product_name || `Product #${item.product_id}`}</td>
                                                        <td className="text-right py-2 px-3">{item.quantity}</td>
                                                        <td className="text-right py-2 px-3">{formatCurrency(item.unit_price)}</td>
                                                        <td className="text-right py-2 px-3 font-medium">{formatCurrency(item.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="font-bold">
                                                    <td colSpan="3" className="text-right py-2 px-3">Total:</td>
                                                    <td className="text-right py-2 px-3 text-blue-600">{formatCurrency(selectedOrder.total_amount)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    {/* Order Timeline Section */}
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                Production Timeline
                                            </h3>
                                            <span className="text-xs text-gray-400">
                                                {selectedOrder.status === 'Delivered' ? '✅ Completed' : '🔄 In Progress'}
                                            </span>
                                        </div>
                                        <OrderTimeline 
                                            orderId={selectedOrder.id} 
                                            onUpdate={() => {
                                                refreshTable();
                                            }}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => generateInvoicePDF(selectedOrder)}
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition flex items-center justify-center gap-2"
                                        >
                                            <FileText className="h-4 w-4" /> Download Invoice
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowStatusUpdate(true);
                                                setSelectedOrderStatus(selectedOrder);
                                            }}
                                            className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-500 transition flex items-center justify-center gap-2"
                                        >
                                            <Edit className="h-4 w-4" /> Update Status
                                        </button>
                                        <button
                                            onClick={() => setShowModal(false)}
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
            {/* STATUS UPDATE MODAL */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showStatusUpdate && selectedOrderStatus && (
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
                                onClick={() => setShowStatusUpdate(false)}
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
                                        <h2 className="text-xl font-bold text-gray-900">Update Order Status</h2>
                                        <button
                                            onClick={() => setShowStatusUpdate(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">Order #{selectedOrderStatus.id} - {selectedOrderStatus.customer_name}</p>
                                    <div className="space-y-2">
                                        {['Pending', 'Production', 'Dispatched', 'Delivered', 'Cancelled'].map(status => (
                                            <button
                                                key={status}
                                                onClick={() => updateOrderStatus(selectedOrderStatus.id, status)}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                                                    selectedOrderStatus.status === status
                                                        ? 'bg-blue-50 border-2 border-blue-500'
                                                        : 'hover:bg-gray-50 border-2 border-transparent'
                                                }`}
                                            >
                                                <span className={`w-3 h-3 rounded-full ${
                                                    status === 'Pending' ? 'bg-gray-500' :
                                                    status === 'Production' ? 'bg-yellow-500' :
                                                    status === 'Dispatched' ? 'bg-blue-500' :
                                                    status === 'Delivered' ? 'bg-green-500' :
                                                    'bg-red-500'
                                                }`}></span>
                                                <span className="font-medium">{status}</span>
                                                {selectedOrderStatus.status === status && (
                                                    <Check className="h-4 w-4 ml-auto text-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowStatusUpdate(false)}
                                        className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===================================================== */}
            {/* CREATE ORDER MODAL WITH DELIVERY OPTION AND PAYMENT METHOD */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showCreateModal && (
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
                                onClick={() => setShowCreateModal(false)}
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
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-gray-900">Create New Order</h2>
                                        <button
                                            onClick={() => setShowCreateModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateOrder} className="max-h-[70vh] overflow-y-auto pr-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Customer Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newOrder.customer_name}
                                                    onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                                                    className="form-control"
                                                    placeholder="Enter customer name"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="text"
                                                    value={newOrder.customer_phone}
                                                    onChange={(e) => setNewOrder({...newOrder, customer_phone: e.target.value})}
                                                    className="form-control"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    value={newOrder.customer_email}
                                                    onChange={(e) => setNewOrder({...newOrder, customer_email: e.target.value})}
                                                    className="form-control"
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Priority</label>
                                                <select
                                                    value={newOrder.priority}
                                                    onChange={(e) => setNewOrder({...newOrder, priority: e.target.value})}
                                                    className="form-control"
                                                >
                                                    <option value="Normal">Normal</option>
                                                    <option value="Urgent">Urgent</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Payment Method *</label>
                                                <select
                                                    required
                                                    value={newOrder.payment_method}
                                                    onChange={(e) => setNewOrder({...newOrder, payment_method: e.target.value})}
                                                    className="form-control"
                                                >
                                                    {paymentMethods.map(method => (
                                                        <option key={method.value} value={method.value}>
                                                            {method.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group flex items-center">
                                                <label className="form-label flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newOrder.requires_delivery}
                                                        onChange={(e) => setNewOrder({...newOrder, requires_delivery: e.target.checked})}
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    />
                                                    <span className="text-sm font-medium">Requires Delivery</span>
                                                    <Truck className="h-4 w-4 text-gray-400" />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Customer Address</label>
                                            <textarea
                                                value={newOrder.customer_address}
                                                onChange={(e) => setNewOrder({...newOrder, customer_address: e.target.value})}
                                                className="form-control"
                                                rows="2"
                                                placeholder="Enter customer address"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Delivery Address</label>
                                            <textarea
                                                value={newOrder.delivery_address}
                                                onChange={(e) => setNewOrder({...newOrder, delivery_address: e.target.value})}
                                                className="form-control"
                                                rows="2"
                                                placeholder="Enter delivery address"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Delivery Date</label>
                                                <input
                                                    type="date"
                                                    value={newOrder.delivery_date}
                                                    onChange={(e) => setNewOrder({...newOrder, delivery_date: e.target.value})}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Delivery Time Slot</label>
                                                <input
                                                    type="text"
                                                    value={newOrder.delivery_time_slot}
                                                    onChange={(e) => setNewOrder({...newOrder, delivery_time_slot: e.target.value})}
                                                    className="form-control"
                                                    placeholder="e.g., Morning, Afternoon"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea
                                                value={newOrder.notes}
                                                onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                                                className="form-control"
                                                rows="2"
                                                placeholder="Special instructions"
                                            />
                                        </div>

                                        <div className="border-t pt-4 mt-4">
                                            <h3 className="font-semibold mb-3">Order Items</h3>
                                            
                                            <div className="grid grid-cols-4 gap-2 mb-2">
                                                <div className="col-span-2">
                                                    <select
                                                        value={newItem.product_id}
                                                        onChange={(e) => {
                                                            const product = products.find(p => p.id === parseInt(e.target.value));
                                                            setNewItem({
                                                                ...newItem,
                                                                product_id: e.target.value,
                                                                unit_price: product?.unit_price || 0
                                                            });
                                                        }}
                                                        className="form-control text-sm"
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} - {formatCurrency(p.unit_price)} (Stock: {p.stock_quantity})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={newItem.quantity}
                                                        onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                                                        className="form-control text-sm"
                                                        placeholder="Qty"
                                                    />
                                                </div>
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddItem}
                                                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition text-sm"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>

                                            {newOrder.items.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm mt-3">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="text-left py-2 px-2">Product</th>
                                                                <th className="text-right py-2 px-2">Qty</th>
                                                                <th className="text-right py-2 px-2">Unit Price</th>
                                                                <th className="text-right py-2 px-2">Total</th>
                                                                <th className="text-center py-2 px-2">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {newOrder.items.map((item, idx) => (
                                                                <tr key={idx} className="border-b">
                                                                    <td className="py-2 px-2">{item.product_name}</td>
                                                                    <td className="text-right py-2 px-2">{item.quantity}</td>
                                                                    <td className="text-right py-2 px-2">{formatCurrency(item.unit_price)}</td>
                                                                    <td className="text-right py-2 px-2 font-medium">{formatCurrency(item.total)}</td>
                                                                    <td className="text-center py-2 px-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveItem(idx)}
                                                                            className="text-red-600 hover:text-red-800"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="font-bold">
                                                                <td colSpan="3" className="text-right py-2 px-2">Total:</td>
                                                                <td className="text-right py-2 px-2 text-blue-600">{formatCurrency(calculateTotal())}</td>
                                                                <td></td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-3 mt-6">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center">
                                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                                        Creating...
                                                    </span>
                                                ) : (
                                                    <>
                                                        <Plus className="h-4 w-4" /> Create Order
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateModal(false)}
                                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition"
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

            {/* ===================================================== */}
            {/* ADD CUSTOMER MODAL */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showCustomerModal && (
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
                                onClick={() => setShowCustomerModal(false)}
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
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-green-100 p-2">
                                                <UserPlus className="h-6 w-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Add New Customer</h2>
                                                <p className="text-sm text-gray-500">Enter customer details</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowCustomerModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddCustomer}>
                                        <div className="form-group">
                                            <label className="form-label">Customer Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newCustomer.name}
                                                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                                                className="form-control"
                                                placeholder="Enter full name"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="form-label">Phone</label>
                                                <input
                                                    type="text"
                                                    value={newCustomer.phone}
                                                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                                                    className="form-control"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Email</label>
                                                <input
                                                    type="email"
                                                    value={newCustomer.email}
                                                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                                                    className="form-control"
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Company</label>
                                            <input
                                                type="text"
                                                value={newCustomer.company}
                                                onChange={(e) => setNewCustomer({...newCustomer, company: e.target.value})}
                                                className="form-control"
                                                placeholder="Enter company name"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Address</label>
                                            <textarea
                                                value={newCustomer.address}
                                                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                                                className="form-control"
                                                rows="2"
                                                placeholder="Enter address"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Notes</label>
                                            <textarea
                                                value={newCustomer.notes}
                                                onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                                                className="form-control"
                                                rows="2"
                                                placeholder="Additional notes"
                                            />
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-500 transition flex items-center justify-center gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" /> Add Customer
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomerModal(false)}
                                                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition"
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