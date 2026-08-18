//frontend/src/components/OrderTimeline.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, CheckCircle, Package, Truck, 
    Shield, Box, Send, XCircle, AlertCircle,
    Calendar, User, Phone, MapPin, FileText,
    ChevronDown, ChevronUp, RefreshCw,
    TrendingUp, TrendingDown, Play, Pause
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/parsers';

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

export default function OrderTimeline({ orderId, onUpdate }) {
    const [timeline, setTimeline] = useState([]);
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProduct, setExpandedProduct] = useState(null);
    const [showAll, setShowAll] = useState(false);
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
            
            // Calculate stats
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
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (timeline.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No timeline entries yet</p>
                <p className="text-xs">Timeline will appear once production starts</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Summary */}
            {stats && (
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Total Items</p>
                        <p className="text-lg font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-yellow-600">Pending</p>
                        <p className="text-lg font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600">In Progress</p>
                        <p className="text-lg font-bold text-blue-600">{stats.inProgress}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600">Completed</p>
                        <p className="text-lg font-bold text-green-600">{stats.completed}</p>
                    </div>
                </div>
            )}

            {/* Product Timeline Groups */}
            <div className="space-y-4">
                {productGroups.map((group, index) => {
                    const latestStatus = group.entries[group.entries.length - 1]?.status || 'PENDING';
                    const statusConfig = getStatusConfig(latestStatus);
                    const StatusIcon = statusConfig.icon;
                    const progress = getStatusProgress(latestStatus);
                    const isExpanded = expandedProduct === group.product_id;

                    return (
                        <motion.div
                            key={group.product_id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
                        >
                            {/* Product Header */}
                            <div 
                                className="p-4 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between"
                                onClick={() => setExpandedProduct(isExpanded ? null : group.product_id)}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
                                        <StatusIcon className={`h-5 w-5 ${statusConfig.textColor}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold text-gray-800">{group.product_name}</p>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {group.product_category}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Qty: {group.order_quantity}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1">
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
                                    <div className="w-24">
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
                                        <div className="p-4">
                                            <div className="space-y-0">
                                                {group.entries.map((entry, idx) => {
                                                    const entryStatus = getStatusConfig(entry.status);
                                                    const EntryIcon = entryStatus.icon;
                                                    const isLast = idx === group.entries.length - 1;
                                                    const isCompleted = entry.status === 'COMPLETED' || entry.status === 'DELIVERED';

                                                    return (
                                                        <div key={entry.id || idx} className="relative">
                                                            {/* Timeline Line */}
                                                            {!isLast && (
                                                                <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                                                            )}
                                                            
                                                            <div className="flex gap-4 pb-6">
                                                                {/* Timeline Dot */}
                                                                <div className="flex-shrink-0 z-10">
                                                                    <div className={`w-8 h-8 rounded-full ${entryStatus.bgColor} ${entryStatus.textColor} flex items-center justify-center border-2 ${isCompleted ? 'border-green-300' : 'border-gray-200'}`}>
                                                                        <EntryIcon className="h-4 w-4" />
                                                                    </div>
                                                                </div>

                                                                {/* Content */}
                                                                <div className="flex-1 pt-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <p className="font-medium text-sm text-gray-800">
                                                                                {entryStatus.label}
                                                                            </p>
                                                                            <span className="text-xs text-gray-400">
                                                                                {formatTimeAgo(entry.created_at)}
                                                                            </span>
                                                                        </div>
                                                                        {entry.estimated_completion && (
                                                                            <span className="text-xs text-gray-400">
                                                                                Est: {formatDate(entry.estimated_completion)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {entry.description && (
                                                                        <p className="text-sm text-gray-600 mt-0.5">
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
            <div className="flex justify-center pt-2">
                <button
                    onClick={fetchTimeline}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Timeline
                </button>
            </div>
        </div>
    );
}