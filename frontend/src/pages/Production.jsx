//frontend/src/pages/Production.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Factory, Plus, Play, CheckCircle, AlertCircle, 
    Clock, Package, TrendingUp, Loader2, Eye, XCircle,
    BarChart3, PieChart, LineChart, Download, Printer,
    RefreshCw, Calendar, Filter, Search, Edit, Trash2,
    AlertTriangle, Info, Activity, Zap, Target, Award,
    Crown, Medal, Users, ChevronDown, ChevronUp,
    X, Layers, List, Grid, FileText, DollarSign,
    TrendingDown, ArrowUpRight, ArrowDownRight, Warehouse,
    ShoppingBag, AlertOctagon, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseNumber, parseIntSafe, parseMachines, parseProductionBatches } from '../utils/parsers';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LineChart as ReLineChart, Line,
    PieChart as RePieChart, Pie, Cell,
    ComposedChart, Area, AreaChart
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
// PRODUCTION METRICS COMPONENT
// =====================================================
const ProductionMetrics = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No production data available</p>
                <p className="text-xs">Start a production batch to see metrics</p>
            </div>
        );
    }

    const totalPlanned = data.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
    const totalActual = data.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
    const totalRejected = data.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
    const completionRate = totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0;
    const rejectionRate = totalActual > 0 ? (totalRejected / totalActual * 100) : 0;
    const activeBatches = data.filter(b => b.status === 'In Progress').length;

    const metrics = [
        { 
            label: 'Total Planned', 
            value: totalPlanned.toLocaleString(), 
            icon: <Target className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        { 
            label: 'Total Produced', 
            value: totalActual.toLocaleString(), 
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        { 
            label: 'Rejected Units', 
            value: totalRejected.toLocaleString(), 
            icon: <AlertCircle className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        { 
            label: 'Active Batches', 
            value: activeBatches, 
            icon: <Activity className="h-5 w-5" />,
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        { 
            label: 'Completion Rate', 
            value: `${completionRate.toFixed(1)}%`, 
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        { 
            label: 'Rejection Rate', 
            value: `${rejectionRate.toFixed(1)}%`, 
            icon: <TrendingDown className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
// STOCK LEVEL METRICS COMPONENT
// =====================================================
const StockMetrics = ({ products }) => {
    if (!products || products.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No product data available</p>
                <p className="text-xs">Add products to monitor stock levels</p>
            </div>
        );
    }

    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + parseIntSafe(p.stock_quantity), 0);
    const lowStockItems = products.filter(p => parseIntSafe(p.stock_quantity) < parseIntSafe(p.min_stock_threshold)).length;
    const outOfStockItems = products.filter(p => parseIntSafe(p.stock_quantity) <= 0).length;
    const totalValue = products.reduce((sum, p) => sum + (parseNumber(p.unit_cost) * parseIntSafe(p.stock_quantity)), 0);

    const metrics = [
        {
            label: 'Total Products',
            value: totalProducts,
            icon: <Package className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Total Stock Units',
            value: totalStock.toLocaleString(),
            icon: <ShoppingBag className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'Low Stock Items',
            value: lowStockItems,
            icon: <AlertTriangle className="h-5 w-5" />,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        {
            label: 'Out of Stock',
            value: outOfStockItems,
            icon: <AlertOctagon className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        {
            label: 'Total Stock Value',
            value: `R${totalValue.toFixed(2)}`,
            icon: <DollarSign className="h-5 w-5" />,
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
// MAIN PRODUCTION COMPONENT
// =====================================================
export default function Production() {
    // =====================================================
    // STATE
    // =====================================================
    const [machines, setMachines] = useState([]);
    const [batches, setBatches] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('batches');
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showMachineModal, setShowMachineModal] = useState(false);
    const [editingMachine, setEditingMachine] = useState(null);
    const [showBatchDetail, setShowBatchDetail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'start_time', direction: 'desc' });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    // Report State
    const [reportPeriod, setReportPeriod] = useState('weekly');
    const [reportData, setReportData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        machinePerformance: [],
        productPerformance: [],
        shiftPerformance: [],
        summary: {
            totalBatches: 0,
            totalProduced: 0,
            totalRejected: 0,
            avgCompletionRate: 0,
            avgRejectionRate: 0,
            efficiencyScore: 0
        }
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Form State
    const [newBatch, setNewBatch] = useState({
        machine_id: '',
        product_id: '',
        planned_quantity: '',
        operator_name: '',
        shift: 'Day',
        notes: ''
    });

    const [newMachine, setNewMachine] = useState({
        name: '',
        machine_type: '',
        model: '',
        serial_number: '',
        installation_date: '',
        status: 'Operational',
        daily_capacity: '',
        current_shift: 'Day'
    });

    // =====================================================
    // EFFECTS
    // =====================================================
    useEffect(() => {
        fetchData();
        generateReportData('weekly');
    }, []);

    // =====================================================
    // API CALLS
    // =====================================================
    const fetchData = async () => {
        try {
            const [machinesRes, batchesRes, productsRes] = await Promise.all([
                axios.get('/api/production/machines'),
                axios.get('/api/production/batches'),
                axios.get('/api/products')
            ]);
            
            setMachines(parseMachines(machinesRes.data));
            setBatches(parseProductionBatches(batchesRes.data));
            setProducts(productsRes.data.map(p => ({
                ...p,
                unit_price: parseNumber(p.unit_price),
                unit_cost: parseNumber(p.unit_cost),
                stock_quantity: parseIntSafe(p.stock_quantity),
                min_stock_threshold: parseIntSafe(p.min_stock_threshold)
            })));
        } catch (error) {
            console.error('Failed to load production data:', error);
            toast.error('Failed to load production data');
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

        const batchData = batches.length > 0 ? batches : generateSampleBatches();

        const now = new Date();
        let count = 0;

        switch(period) {
            case 'daily': count = 30; break;
            case 'weekly': count = 12; break;
            case 'monthly': count = 12; break;
            default: count = 12;
        }

        const timeData = Array.from({ length: count }, (_, i) => {
            const date = new Date(now);
            if (period === 'daily') date.setDate(date.getDate() - (count - 1 - i));
            else if (period === 'weekly') date.setDate(date.getDate() - (count - 1 - i) * 7);
            else if (period === 'monthly') date.setMonth(date.getMonth() - (count - 1 - i));
            
            const dailyBatches = batchData.filter(b => {
                const batchDate = new Date(b.start_time);
                return batchDate.toDateString() === date.toDateString();
            });

            const planned = dailyBatches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
            const actual = dailyBatches.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
            const rejected = dailyBatches.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
            const completed = dailyBatches.filter(b => b.status === 'Completed').length;

            return {
                label: date.toLocaleDateString('en-ZA', { 
                    month: 'short', 
                    day: period === 'daily' || period === 'weekly' ? 'numeric' : undefined,
                    year: period === 'monthly' ? 'numeric' : undefined
                }),
                planned,
                actual,
                rejected,
                completed,
                efficiency: planned > 0 ? (actual / planned * 100) : 0,
                date
            };
        });

        const machinePerformance = machines.map(machine => {
            const machineBatches = batchData.filter(b => b.machine_id === machine.id);
            const totalPlanned = machineBatches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
            const totalActual = machineBatches.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
            const totalRejected = machineBatches.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
            const batchCount = machineBatches.length;
            const completionRate = totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0;
            const rejectionRate = totalActual > 0 ? (totalRejected / totalActual * 100) : 0;
            
            return {
                name: machine.name,
                totalPlanned,
                totalActual,
                totalRejected,
                batchCount,
                completionRate,
                rejectionRate,
                efficiency: completionRate * (1 - rejectionRate / 100)
            };
        });

        const productPerformance = products.map(product => {
            const productBatches = batchData.filter(b => b.product_id === product.id);
            const totalPlanned = productBatches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
            const totalActual = productBatches.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
            const totalRejected = productBatches.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
            
            return {
                name: product.name,
                totalPlanned,
                totalActual,
                totalRejected,
                completionRate: totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0,
                rejectionRate: totalActual > 0 ? (totalRejected / totalActual * 100) : 0
            };
        }).filter(p => p.totalPlanned > 0).sort((a, b) => b.totalActual - a.totalActual);

        const shifts = ['Day', 'Night'];
        const shiftPerformance = shifts.map(shift => {
            const shiftBatches = batchData.filter(b => b.shift === shift);
            const totalPlanned = shiftBatches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
            const totalActual = shiftBatches.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
            const totalRejected = shiftBatches.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
            
            return {
                name: shift,
                totalPlanned,
                totalActual,
                totalRejected,
                completionRate: totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0,
                rejectionRate: totalActual > 0 ? (totalRejected / totalActual * 100) : 0,
                batchCount: shiftBatches.length
            };
        });

        const totalPlanned = batchData.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
        const totalActual = batchData.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
        const totalRejected = batchData.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
        const completedBatches = batchData.filter(b => b.status === 'Completed').length;
        const avgCompletionRate = totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0;
        const avgRejectionRate = totalActual > 0 ? (totalRejected / totalActual * 100) : 0;
        const efficiencyScore = avgCompletionRate * (1 - avgRejectionRate / 100);

        setReportData({
            daily: timeData,
            weekly: timeData,
            monthly: timeData,
            machinePerformance,
            productPerformance,
            shiftPerformance,
            summary: {
                totalBatches: batchData.length,
                totalProduced: totalActual,
                totalRejected,
                completedBatches,
                avgCompletionRate,
                avgRejectionRate,
                efficiencyScore
            }
        });
        setReportLoading(false);
    };

    const generateSampleBatches = () => {
        const sampleBatches = [];
        const now = new Date();
        
        for (let i = 0; i < 20; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            const machine = machines[i % machines.length] || { id: i + 1, name: `Machine ${i + 1}` };
            const product = products[i % products.length] || { id: i + 1, name: `Product ${i + 1}` };
            const planned = Math.round(5000 + Math.random() * 10000);
            const actual = Math.round(planned * (0.7 + Math.random() * 0.3));
            const rejected = Math.round(actual * (0.01 + Math.random() * 0.05));
            
            sampleBatches.push({
                id: i + 1,
                batch_number: `BATCH-${String(i + 1).padStart(4, '0')}`,
                machine_id: machine.id,
                machine_name: machine.name,
                product_id: product.id,
                product_name: product.name,
                planned_quantity: planned,
                actual_quantity: actual,
                rejected_quantity: rejected,
                status: ['In Progress', 'Completed', 'Completed', 'Completed', 'Completed'][Math.floor(Math.random() * 5)],
                operator_name: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown'][Math.floor(Math.random() * 4)],
                shift: ['Day', 'Night'][Math.floor(Math.random() * 2)],
                start_time: date.toISOString(),
                end_time: new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString(),
                notes: ''
            });
        }
        
        return sampleBatches;
    };

    // =====================================================
    // CRUD OPERATIONS
    // =====================================================
    const handleCreateBatch = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/production/batches', {
                ...newBatch,
                planned_quantity: parseInt(newBatch.planned_quantity)
            });
            toast.success('Production batch created successfully!');
            setShowBatchModal(false);
            setNewBatch({
                machine_id: '',
                product_id: '',
                planned_quantity: '',
                operator_name: '',
                shift: 'Day',
                notes: ''
            });
            refreshData();
        } catch (error) {
            console.error('Failed to create batch:', error);
            toast.error('Failed to create batch');
        }
    };

    const handleCompleteBatch = async (batchId, actualQuantity, rejectedQuantity) => {
        if (!actualQuantity || actualQuantity <= 0) {
            toast.error('Please enter actual production quantity');
            return;
        }
        try {
            await axios.put(`/api/production/batches/${batchId}/complete`, {
                actual_quantity: parseInt(actualQuantity),
                rejected_quantity: parseInt(rejectedQuantity) || 0
            });
            toast.success('Batch completed successfully!');
            refreshData();
        } catch (error) {
            console.error('Failed to complete batch:', error);
            toast.error('Failed to complete batch');
        }
    };

    const handleCreateMachine = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/production/machines', {
                ...newMachine,
                daily_capacity: parseInt(newMachine.daily_capacity)
            });
            toast.success('Machine added successfully!');
            setShowMachineModal(false);
            setNewMachine({
                name: '',
                machine_type: '',
                model: '',
                serial_number: '',
                installation_date: '',
                status: 'Operational',
                daily_capacity: '',
                current_shift: 'Day'
            });
            refreshData();
        } catch (error) {
            console.error('Failed to create machine:', error);
            toast.error('Failed to create machine');
        }
    };

    const handleUpdateMachine = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/production/machines/${editingMachine.id}`, {
                ...newMachine
            });
            toast.success('Machine updated successfully!');
            setShowMachineModal(false);
            setEditingMachine(null);
            setNewMachine({
                name: '',
                machine_type: '',
                model: '',
                serial_number: '',
                installation_date: '',
                status: 'Operational',
                daily_capacity: '',
                current_shift: 'Day'
            });
            refreshData();
        } catch (error) {
            console.error('Failed to update machine:', error);
            toast.error('Failed to update machine');
        }
    };

    const handleDeleteMachine = async (id) => {
        if (!confirm('Are you sure you want to delete this machine?')) return;
        try {
            await axios.delete(`/api/production/machines/${id}`);
            toast.success('Machine deleted successfully');
            refreshData();
        } catch (error) {
            console.error('Failed to delete machine:', error);
            toast.error('Failed to delete machine');
        }
    };

    const handleEditMachine = (machine) => {
        setEditingMachine(machine);
        setNewMachine({
            name: machine.name,
            machine_type: machine.machine_type,
            model: machine.model || '',
            serial_number: machine.serial_number || '',
            installation_date: machine.installation_date ? new Date(machine.installation_date).toISOString().split('T')[0] : '',
            status: machine.status,
            daily_capacity: machine.daily_capacity.toString(),
            current_shift: machine.current_shift || 'Day'
        });
        setShowMachineModal(true);
    };

    const handleReportPeriodChange = (period) => {
        setReportPeriod(period);
        generateReportData(period);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const getStatusColor = (status) => {
        const colors = {
            'Completed': 'bg-green-100 text-green-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Cancelled': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Completed': return <CheckCircle className="h-3 w-3" />;
            case 'In Progress': return <Play className="h-3 w-3" />;
            case 'Pending': return <Clock className="h-3 w-3" />;
            case 'Cancelled': return <XCircle className="h-3 w-3" />;
            default: return <AlertCircle className="h-3 w-3" />;
        }
    };

    const getMachineStatusColor = (status) => {
        const colors = {
            'Operational': 'border-green-500',
            'Maintenance': 'border-yellow-500',
            'Repair': 'border-red-500',
            'Inactive': 'border-gray-400'
        };
        return colors[status] || 'border-gray-400';
    };

    const getMachineStatusBadge = (status) => {
        const colors = {
            'Operational': 'bg-green-100 text-green-700',
            'Maintenance': 'bg-yellow-100 text-yellow-700',
            'Repair': 'bg-red-100 text-red-700',
            'Inactive': 'bg-gray-100 text-gray-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStockStatus = (product) => {
        const stock = parseIntSafe(product.stock_quantity);
        const threshold = parseIntSafe(product.min_stock_threshold);
        
        if (stock <= 0) {
            return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: <AlertOctagon className="h-3 w-3" /> };
        } else if (stock < threshold) {
            return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="h-3 w-3" /> };
        } else if (stock < threshold * 2) {
            return { label: 'Medium Stock', color: 'bg-blue-100 text-blue-700', icon: <Package className="h-3 w-3" /> };
        } else {
            return { label: 'Healthy Stock', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> };
        }
    };

    const filteredBatches = batches.filter(batch => {
        const matchesSearch = batch.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             batch.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             batch.machine_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
        const matchesShift = shiftFilter === 'all' || batch.shift === shiftFilter;
        return matchesSearch && matchesStatus && matchesShift;
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
    });

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             product.category?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStock = stockFilter === 'all' ||
                            (stockFilter === 'low' && parseIntSafe(product.stock_quantity) < parseIntSafe(product.min_stock_threshold)) ||
                            (stockFilter === 'out' && parseIntSafe(product.stock_quantity) <= 0) ||
                            (stockFilter === 'healthy' && parseIntSafe(product.stock_quantity) >= parseIntSafe(product.min_stock_threshold) * 2);
        return matchesSearch && matchesStock;
    });

    const tabs = [
        { id: 'batches', label: 'Batches', icon: <Factory size={16} /> },
        { id: 'machines', label: 'Machines', icon: <Layers size={16} /> },
        { id: 'stock', label: 'Stock Levels', icon: <Warehouse size={16} /> },
        { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 size={16} /> },
        { id: 'insights', label: 'Insights', icon: <Activity size={16} /> }
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
    // RENDER: BATCHES TAB
    // =====================================================
    const renderBatchesTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <ProductionMetrics data={batches} />

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
                            placeholder="Search batches..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <select
                                value={shiftFilter}
                                onChange={(e) => setShiftFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Shifts</option>
                                <option value="Day">Day</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setShiftFilter('all');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'batch_number', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Batch #
                                        {sortConfig.key === 'batch_number' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium">Machine</th>
                                <th className="py-3 px-4 font-medium">Product</th>
                                <th className="py-3 px-4 font-medium text-right">Planned</th>
                                <th className="py-3 px-4 font-medium text-right">Actual</th>
                                <th className="py-3 px-4 font-medium text-right">Rejected</th>
                                <th className="py-3 px-4 font-medium text-center">Status</th>
                                <th className="py-3 px-4 font-medium">Operator</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredBatches.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-gray-400">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No batches found</p>
                                        <p className="text-xs">Start a new production batch to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBatches.map((batch, index) => (
                                    <motion.tr 
                                        key={batch.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4 font-medium text-gray-900">{batch.batch_number}</td>
                                        <td className="py-3 px-4">{batch.machine_name}</td>
                                        <td className="py-3 px-4">{batch.product_name}</td>
                                        <td className="py-3 px-4 text-right">{batch.planned_quantity?.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-medium text-green-600">{batch.actual_quantity?.toLocaleString() || '-'}</td>
                                        <td className="py-3 px-4 text-right text-red-600">{batch.rejected_quantity?.toLocaleString() || 0}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                                                {getStatusIcon(batch.status)}
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{batch.operator_name || '-'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {batch.status === 'In Progress' && (
                                                    <button
                                                        onClick={() => {
                                                            const actual = prompt('Enter actual production quantity:');
                                                            if (actual) {
                                                                const rejected = prompt('Enter rejected quantity (optional):', '0');
                                                                handleCompleteBatch(batch.id, actual, rejected || 0);
                                                            }
                                                        }}
                                                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"
                                                        title="Complete Batch"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowBatchDetail(batch)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                    Showing {filteredBatches.length} of {batches.length} batches
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: MACHINES TAB
    // =====================================================
    const renderMachinesTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Machines Overview</h2>
                    <p className="text-sm text-gray-500">Manage production machines and their status</p>
                </div>
                <button
                    onClick={() => {
                        setEditingMachine(null);
                        setNewMachine({
                            name: '',
                            machine_type: '',
                            model: '',
                            serial_number: '',
                            installation_date: '',
                            status: 'Operational',
                            daily_capacity: '',
                            current_shift: 'Day'
                        });
                        setShowMachineModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> Add Machine
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {machines.map((machine) => (
                    <motion.div
                        key={machine.id}
                        whileHover={{ y: -2 }}
                        className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${getMachineStatusColor(machine.status)} border border-gray-200 hover:shadow-md transition`}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{machine.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getMachineStatusBadge(machine.status)}`}>
                                {machine.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">{machine.machine_type}</p>
                        {machine.model && <p className="text-xs text-gray-400">Model: {machine.model}</p>}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Capacity:</span>
                                <span className="font-medium block">{machine.daily_capacity}/day</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Shift:</span>
                                <span className="font-medium block">{machine.current_shift}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Batches:</span>
                                <span className="font-medium block">{machine.total_batches || 0}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Produced:</span>
                                <span className="font-medium block">{machine.total_produced?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1">
                            <button
                                onClick={() => handleEditMachine(machine)}
                                className="flex-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs"
                            >
                                <Edit size={14} className="inline mr-1" /> Edit
                            </button>
                            <button
                                onClick={() => handleDeleteMachine(machine.id)}
                                className="flex-1 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition text-xs"
                            >
                                <Trash2 size={14} className="inline mr-1" /> Delete
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: STOCK LEVELS TAB
    // =====================================================
    const renderStockTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <StockMetrics products={products} />

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
                            placeholder="Search products..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Stock</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                                <option value="healthy">Healthy Stock</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setStockFilter('all');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium">Product</th>
                                <th className="py-3 px-4 font-medium">Category</th>
                                <th className="py-3 px-4 font-medium text-right">Stock Qty</th>
                                <th className="py-3 px-4 font-medium text-right">Min Threshold</th>
                                <th className="py-3 px-4 font-medium text-center">Status</th>
                                <th className="py-3 px-4 font-medium text-right">Unit Cost</th>
                                <th className="py-3 px-4 font-medium text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-400">
                                        <Warehouse className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No products found</p>
                                        <p className="text-xs">Add products to monitor stock levels</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => {
                                    const stockStatus = getStockStatus(product);
                                    const stock = parseIntSafe(product.stock_quantity);
                                    const threshold = parseIntSafe(product.min_stock_threshold);
                                    const totalValue = stock * parseNumber(product.unit_cost);

                                    return (
                                        <motion.tr 
                                            key={product.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${
                                                        stockStatus.color.split(' ')[0].replace('bg-', 'bg-') + '-100'
                                                    }`}>
                                                        <Package className={`h-4 w-4 ${
                                                            stockStatus.color.split(' ')[1].replace('text-', 'text-')
                                                        }`} />
                                                    </div>
                                                    <span className="font-medium">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                <span className={stock <= 0 ? 'text-red-600' : stock < threshold ? 'text-yellow-600' : 'text-gray-900'}>
                                                    {stock.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-gray-500">{threshold.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                                    {stockStatus.icon}
                                                    {stockStatus.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">R{parseNumber(product.unit_cost).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-right font-medium text-blue-600">R{totalValue.toFixed(2)}</td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
                    <span>Showing {filteredProducts.length} of {products.length} products</span>
                    <span>Total Stock Value: <strong className="text-blue-600">R{products.reduce((sum, p) => sum + (parseIntSafe(p.stock_quantity) * parseNumber(p.unit_cost)), 0).toFixed(2)}</strong></span>
                </div>
            </div>

            {/* Stock Distribution Chart */}
            {products.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-purple-500" />
                        Stock Distribution by Category
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <RePieChart>
                                <Pie
                                    data={products.reduce((acc, p) => {
                                        const existing = acc.find(a => a.name === p.category);
                                        if (existing) {
                                            existing.value += parseIntSafe(p.stock_quantity);
                                        } else {
                                            acc.push({ name: p.category, value: parseIntSafe(p.stock_quantity) });
                                        }
                                        return acc;
                                    }, [])}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {products.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value.toLocaleString()} units`} />
                            </RePieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col justify-center gap-2">
                            {products.reduce((acc, p) => {
                                const existing = acc.find(a => a.name === p.category);
                                if (existing) {
                                    existing.value += parseIntSafe(p.stock_quantity);
                                } else {
                                    acc.push({ name: p.category, value: parseIntSafe(p.stock_quantity) });
                                }
                                return acc;
                            }, []).sort((a, b) => b.value - a.value).map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600">{item.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );

    // =====================================================
    // RENDER: REPORTS TAB
    // =====================================================
    const renderReportsTab = () => {
        const { summary, machinePerformance, productPerformance, shiftPerformance } = reportData;

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
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

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Batches', value: summary.totalBatches, icon: <Factory className="h-4 w-4" />, color: 'blue' },
                        { label: 'Total Produced', value: summary.totalProduced?.toLocaleString(), icon: <Package className="h-4 w-4" />, color: 'green' },
                        { label: 'Rejected Units', value: summary.totalRejected?.toLocaleString(), icon: <AlertCircle className="h-4 w-4" />, color: 'red' },
                        { label: 'Completed', value: summary.completedBatches, icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
                        { label: 'Completion Rate', value: `${summary.avgCompletionRate?.toFixed(1) || 0}%`, icon: <TrendingUp className="h-4 w-4" />, color: 'blue' },
                        { label: 'Efficiency Score', value: `${summary.efficiencyScore?.toFixed(1) || 0}%`, icon: <Zap className="h-4 w-4" />, color: 'purple' }
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
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChart className="h-4 w-4 text-blue-500" />
                                Production Trend ({reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)})
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={reportData[reportPeriod] || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'planned') return [value.toLocaleString(), 'Planned'];
                                            if (name === 'actual') return [value.toLocaleString(), 'Actual'];
                                            if (name === 'rejected') return [value.toLocaleString(), 'Rejected'];
                                            if (name === 'efficiency') return [`${value.toFixed(1)}%`, 'Efficiency'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="planned" fill="#93c5fd" name="Planned" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="actual" fill="#3b82f6" name="Actual" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="efficiency" stroke="#10b981" name="Efficiency" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-purple-500" />
                                    Machine Performance
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={machinePerformance}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value, name) => {
                                                if (name === 'totalActual') return [value.toLocaleString(), 'Produced'];
                                                if (name === 'completionRate' || name === 'efficiency') return [`${value.toFixed(1)}%`, name === 'completionRate' ? 'Completion Rate' : 'Efficiency'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalActual" fill="#3b82f6" name="Produced" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="totalRejected" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-orange-500" />
                                    Shift Performance
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {shiftPerformance.map((shift, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{shift.name} Shift</span>
                                                <span className="text-sm text-gray-500">{shift.batchCount} batches</span>
                                            </div>
                                            <div className="mt-2 space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Produced:</span>
                                                    <span className="font-medium">{shift.totalActual?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Rejected:</span>
                                                    <span className="font-medium text-red-600">{shift.totalRejected?.toLocaleString() || 0}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Efficiency:</span>
                                                    <span className={`font-medium ${shift.completionRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {shift.completionRate?.toFixed(1) || 0}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${shift.completionRate >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                    style={{ width: `${Math.min(shift.completionRate || 0, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {productPerformance.length > 0 && (
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    Top Products by Production Volume
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {productPerformance.slice(0, 6).map((product, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                                    <p className="text-xs text-gray-400">{product.totalActual?.toLocaleString()} units</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-medium ${product.completionRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {product.completionRate?.toFixed(1) || 0}%
                                                </p>
                                                <p className="text-xs text-gray-400">completion</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        );
    };

    // =====================================================
    // RENDER: INSIGHTS TAB
    // =====================================================
    const renderInsightsTab = () => {
        const { summary } = reportData;
        
        const totalPlanned = batches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
        const totalActual = batches.reduce((sum, b) => sum + (b.actual_quantity || 0), 0);
        const totalRejected = batches.reduce((sum, b) => sum + (b.rejected_quantity || 0), 0);
        const activeBatches = batches.filter(b => b.status === 'In Progress').length;
        const overdueBatches = batches.filter(b => b.status === 'In Progress' && new Date(b.start_time) < new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        const efficiency = totalPlanned > 0 ? (totalActual / totalPlanned * 100) : 0;
        const rejectionRate = totalActual > 0 ? (totalRejected / totalActual * 100) : 0;
        const lowStockCount = products.filter(p => parseIntSafe(p.stock_quantity) < parseIntSafe(p.min_stock_threshold)).length;

        const insights = [
            {
                title: 'Production Efficiency',
                value: `${efficiency.toFixed(1)}%`,
                description: efficiency >= 85 ? 'Excellent efficiency. Production is running smoothly.' : 
                           efficiency >= 70 ? 'Good efficiency. There is room for improvement.' :
                           'Low efficiency. Review production processes.',
                color: efficiency >= 85 ? 'green' : efficiency >= 70 ? 'yellow' : 'red',
                icon: <Zap className="h-6 w-6" />
            },
            {
                title: 'Quality Score',
                value: `${(100 - rejectionRate).toFixed(1)}%`,
                description: rejectionRate <= 3 ? 'Excellent quality. Low rejection rate.' :
                           rejectionRate <= 8 ? 'Good quality. Monitor rejection trends.' :
                           'Quality concerns. Review quality control processes.',
                color: rejectionRate <= 3 ? 'green' : rejectionRate <= 8 ? 'yellow' : 'red',
                icon: <Target className="h-6 w-6" />
            },
            {
                title: 'Stock Alert',
                value: `${lowStockCount} Items`,
                description: lowStockCount === 0 ? 'All products have healthy stock levels.' :
                           lowStockCount > 5 ? `${lowStockCount} products need immediate attention.` :
                           `${lowStockCount} products are low on stock.`,
                color: lowStockCount === 0 ? 'green' : lowStockCount > 5 ? 'red' : 'yellow',
                icon: <Warehouse className="h-6 w-6" />
            },
            {
                title: 'Rejection Rate',
                value: `${rejectionRate.toFixed(1)}%`,
                description: rejectionRate <= 3 ? 'Minimal waste. Cost-efficient production.' :
                           rejectionRate <= 8 ? 'Moderate waste. Look for optimization opportunities.' :
                           'High waste. Review production quality.',
                color: rejectionRate <= 3 ? 'green' : rejectionRate <= 8 ? 'yellow' : 'red',
                icon: <AlertCircle className="h-6 w-6" />
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
                                'border-blue-500'
                            } border border-gray-200 shadow-sm`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${
                                    insight.color === 'green' ? 'bg-green-100 text-green-600' :
                                    insight.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                                    insight.color === 'red' ? 'bg-red-100 text-red-600' :
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
                                            'text-blue-600'
                                        }`}>
                                            {insight.value}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                                    {insight.title === 'Production Efficiency' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    efficiency >= 85 ? 'bg-green-500' :
                                                    efficiency >= 70 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(efficiency, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {insight.title === 'Quality Score' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    (100 - rejectionRate) >= 97 ? 'bg-green-500' :
                                                    (100 - rejectionRate) >= 92 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                style={{ width: `${Math.min(100 - rejectionRate, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {insight.title === 'Stock Alert' && (
                                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    lowStockCount === 0 ? 'bg-green-500' :
                                                    lowStockCount > 5 ? 'bg-red-500' :
                                                    'bg-yellow-500'
                                                }`}
                                                style={{ width: `${Math.min((1 - lowStockCount / products.length) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Production Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Batches</p>
                            <p className="text-xl font-bold">{batches.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Planned Units</p>
                            <p className="text-xl font-bold">{totalPlanned.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Produced Units</p>
                            <p className="text-xl font-bold text-green-600">{totalActual.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Rejected Units</p>
                            <p className="text-xl font-bold text-red-600">{totalRejected.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                        <span className="text-gray-500">Completion Rate: <strong className="text-gray-900">{summary.avgCompletionRate?.toFixed(1) || 0}%</strong></span>
                        <span className="text-gray-500">Rejection Rate: <strong className="text-gray-900">{summary.avgRejectionRate?.toFixed(1) || 0}%</strong></span>
                        <span className="text-gray-500">Efficiency Score: <strong className="text-gray-900">{summary.efficiencyScore?.toFixed(1) || 0}%</strong></span>
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
            <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Factory className="h-7 w-7 mr-2 text-blue-500" />
                        Production Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Track production batches, machine performance, and stock levels
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
                        onClick={() => setShowBatchModal(true)}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Batch
                    </motion.button>
                </div>
            </motion.div>

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

            {activeTab === 'batches' && renderBatchesTab()}
            {activeTab === 'machines' && renderMachinesTab()}
            {activeTab === 'stock' && renderStockTab()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'insights' && renderInsightsTab()}

            {/* Modals remain the same as before */}
            {/* Batch Detail Modal */}
            <AnimatePresence>
                {showBatchDetail && (
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
                                onClick={() => setShowBatchDetail(null)}
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
                                            <Package className="h-5 w-5 text-blue-500" />
                                            <h2 className="text-xl font-bold text-gray-900">{showBatchDetail.batch_number}</h2>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(showBatchDetail.status)}`}>
                                                {showBatchDetail.status}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowBatchDetail(null)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Product</p>
                                            <p className="font-medium">{showBatchDetail.product_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Machine</p>
                                            <p className="font-medium">{showBatchDetail.machine_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Operator</p>
                                            <p className="font-medium">{showBatchDetail.operator_name || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Shift</p>
                                            <p className="font-medium">{showBatchDetail.shift}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Planned Quantity</p>
                                            <p className="font-medium">{showBatchDetail.planned_quantity?.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Actual Quantity</p>
                                            <p className="font-medium text-green-600">{showBatchDetail.actual_quantity?.toLocaleString() || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Rejected Quantity</p>
                                            <p className="font-medium text-red-600">{showBatchDetail.rejected_quantity?.toLocaleString() || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Start Time</p>
                                            <p className="font-medium">{new Date(showBatchDetail.start_time).toLocaleString()}</p>
                                        </div>
                                        {showBatchDetail.end_time && (
                                            <div className="col-span-2">
                                                <p className="text-gray-500">End Time</p>
                                                <p className="font-medium">{new Date(showBatchDetail.end_time).toLocaleString()}</p>
                                            </div>
                                        )}
                                        {showBatchDetail.notes && (
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Notes</p>
                                                <p className="font-medium text-sm bg-gray-50 p-2 rounded">{showBatchDetail.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                                        {showBatchDetail.status === 'In Progress' && (
                                            <button
                                                onClick={() => {
                                                    const actual = prompt('Enter actual production quantity:');
                                                    if (actual) {
                                                        const rejected = prompt('Enter rejected quantity (optional):', '0');
                                                        handleCompleteBatch(showBatchDetail.id, actual, rejected || 0);
                                                        setShowBatchDetail(null);
                                                    }
                                                }}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-500 transition flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Complete Batch
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowBatchDetail(null)}
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

            {/* New Batch Modal */}
            <AnimatePresence>
                {showBatchModal && (
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
                                onClick={() => setShowBatchModal(false)}
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
                                            <div className="rounded-lg bg-blue-100 p-2">
                                                <Plus className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">Start New Batch</h2>
                                                <p className="text-sm text-gray-500">Create a new production batch</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowBatchModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleCreateBatch}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Machine *</label>
                                                <select
                                                    required
                                                    value={newBatch.machine_id}
                                                    onChange={(e) => setNewBatch({...newBatch, machine_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Machine</option>
                                                    {machines.filter(m => m.status === 'Operational').map(m => (
                                                        <option key={m.id} value={m.id}>{m.name} (Capacity: {m.daily_capacity}/day)</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Product *</label>
                                                <select
                                                    required
                                                    value={newBatch.product_id}
                                                    onChange={(e) => setNewBatch({...newBatch, product_id: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Product</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Planned Quantity *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={newBatch.planned_quantity}
                                                    onChange={(e) => setNewBatch({...newBatch, planned_quantity: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., 8000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Operator Name</label>
                                                <input
                                                    type="text"
                                                    value={newBatch.operator_name}
                                                    onChange={(e) => setNewBatch({...newBatch, operator_name: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Operator name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Shift</label>
                                                <select
                                                    value={newBatch.shift}
                                                    onChange={(e) => setNewBatch({...newBatch, shift: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Day">Day</option>
                                                    <option value="Night">Night</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                                <textarea
                                                    value={newBatch.notes}
                                                    onChange={(e) => setNewBatch({...newBatch, notes: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    rows="2"
                                                    placeholder="Optional notes"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Start Batch
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowBatchModal(false)}
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

            {/* Machine Modal (Add/Edit) */}
            <AnimatePresence>
                {showMachineModal && (
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
                                onClick={() => {
                                    setShowMachineModal(false);
                                    setEditingMachine(null);
                                }}
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
                                            <div className={`rounded-lg p-2 ${editingMachine ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                                {editingMachine ? <Edit className="h-5 w-5 text-yellow-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {editingMachine ? 'Edit Machine' : 'Add Machine'}
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {editingMachine ? 'Update machine details' : 'Add a new production machine'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowMachineModal(false);
                                                setEditingMachine(null);
                                            }}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={editingMachine ? handleUpdateMachine : handleCreateMachine}>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Machine Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newMachine.name}
                                                    onChange={(e) => setNewMachine({...newMachine, name: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., Brick Press 1"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Machine Type *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newMachine.machine_type}
                                                    onChange={(e) => setNewMachine({...newMachine, machine_type: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder="e.g., Hydraulic Press"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Model</label>
                                                    <input
                                                        type="text"
                                                        value={newMachine.model}
                                                        onChange={(e) => setNewMachine({...newMachine, model: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Model"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                                                    <input
                                                        type="text"
                                                        value={newMachine.serial_number}
                                                        onChange={(e) => setNewMachine({...newMachine, serial_number: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Serial #"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Installation Date</label>
                                                <input
                                                    type="date"
                                                    value={newMachine.installation_date}
                                                    onChange={(e) => setNewMachine({...newMachine, installation_date: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Daily Capacity *</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="1"
                                                        value={newMachine.daily_capacity}
                                                        onChange={(e) => setNewMachine({...newMachine, daily_capacity: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="e.g., 10000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Current Shift</label>
                                                    <select
                                                        value={newMachine.current_shift}
                                                        onChange={(e) => setNewMachine({...newMachine, current_shift: e.target.value})}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="Day">Day</option>
                                                        <option value="Night">Night</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                                <select
                                                    value={newMachine.status}
                                                    onChange={(e) => setNewMachine({...newMachine, status: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Operational">Operational</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                    <option value="Repair">Repair</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                            >
                                                {editingMachine ? 'Update Machine' : 'Add Machine'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowMachineModal(false);
                                                    setEditingMachine(null);
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