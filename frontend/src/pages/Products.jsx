//frontend/src/pages/Products.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, Plus, Edit, Trash2, Loader2, 
    TrendingUp, TrendingDown, DollarSign, BarChart3,
    Calendar, Clock, Filter, Download, Printer,
    Eye, ChevronDown, X, Search, AlertCircle,
    PieChart, LineChart, RefreshCw, FileText,
    ArrowUpRight, ArrowDownRight, Layers, List,
    Grid, CheckCircle, AlertTriangle, Activity,
    Award, Crown, Medal, Zap, Target, Star,
    ChevronLeft, ChevronRight, Settings, Info,
    Warehouse, Tag, ShoppingBag, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LineChart as ReLineChart, Line,
    PieChart as RePieChart, Pie, Cell,
    ComposedChart, Area
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/parsers';

// Animation variants
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f472b6', '#22d3ee'];

export default function Products() {
    // =====================================================
    // STATE
    // =====================================================
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('list');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    // Report filters
    const [reportPeriod, setReportPeriod] = useState('monthly');
    const [reportView, setReportView] = useState('all');
    const [selectedReportProduct, setSelectedReportProduct] = useState(null);
    
    // Report data
    const [reportData, setReportData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        yearly: [],
        productPerformance: {},
        topProducts: [],
        bottomProducts: [],
        summary: {}
    });
    
    // Filters
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        minStock: '',
        maxStock: ''
    });
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit_price: '',
        stock_quantity: '',
        min_stock_threshold: '',
        unit_cost: '',
        sku: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);

    // =====================================================
    // EFFECTS
    // =====================================================
    useEffect(() => {
        fetchProducts();
        fetchReportData();
    }, []);

    useEffect(() => {
        if (activeTab === 'reports') {
            fetchReportData();
        }
    }, [reportPeriod, reportView, selectedReportProduct, dateRange]);

    // =====================================================
    // API CALLS
    // =====================================================
    const fetchProducts = async () => {
        try {
            const res = await axios.get('/api/products');
            const parsedProducts = res.data.map(product => ({
                ...product,
                unit_price: parseFloat(product.unit_price) || 0,
                stock_quantity: parseInt(product.stock_quantity) || 0,
                min_stock_threshold: parseInt(product.min_stock_threshold) || 0,
                unit_cost: parseFloat(product.unit_cost) || 0
            }));
            setProducts(parsedProducts);
            if (parsedProducts.length > 0 && !selectedReportProduct) {
                setSelectedReportProduct(parsedProducts[0]);
            }
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const fetchReportData = async () => {
        try {
            const data = generateReportData();
            setReportData(data);
        } catch (error) {
            console.error('Failed to fetch report data:', error);
        }
    };

    const refreshTable = () => {
        setTableRefreshKey(prev => prev + 1);
        fetchProducts();
        fetchReportData();
    };

    // =====================================================
    // DATA GENERATION
    // =====================================================
    const generateReportData = () => {
        const productNames = products.length > 0 
            ? products.map(p => p.name) 
            : ['Standard Brick', 'Face Brick', 'Cement 50kg', 'River Sand', 'Paving Block', 
               'Premium Brick', 'Concrete Block', 'Mortar Mix', 'Plaster Sand', 'Building Stone'];
        
        const categories = ['Bricks', 'Bricks', 'Cement', 'Aggregates', 'Blocks', 
                           'Bricks', 'Blocks', 'Cement', 'Aggregates', 'Stone'];
        
        const generateProductData = (productName, count, interval) => {
            const baseRevenue = 500 + Math.random() * 8000;
            const baseUnits = 20 + Math.random() * 300;
            const trend = 0.6 + Math.random() * 0.8;
            
            return Array.from({ length: count }, (_, i) => {
                const date = new Date();
                if (interval === 'daily') date.setDate(date.getDate() - (count - i));
                else if (interval === 'weekly') date.setDate(date.getDate() - (count - i) * 7);
                else if (interval === 'monthly') date.setMonth(date.getMonth() - (count - i));
                else date.setFullYear(date.getFullYear() - (count - i));
                
                const variation = 0.7 + Math.random() * 0.6;
                const value = baseRevenue * trend * variation;
                
                return {
                    date: date.toISOString().split('T')[0],
                    label: interval === 'daily' ? date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) :
                           interval === 'weekly' ? `Week ${i+1}` :
                           interval === 'monthly' ? date.toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' }) :
                           date.getFullYear().toString(),
                    revenue: Math.round(value * 100) / 100,
                    units: Math.round(baseUnits * trend * variation),
                    profit: Math.round(value * 0.3 * 100) / 100,
                    orders: Math.round((3 + Math.random() * 25) * trend * variation),
                    productName: productName,
                    category: categories[productNames.indexOf(productName) % categories.length]
                };
            });
        };

        const productPerformance = {};
        const productMetrics = [];
        
        productNames.forEach((name, index) => {
            const daily = generateProductData(name, 30, 'daily');
            const weekly = generateProductData(name, 12, 'weekly');
            const monthly = generateProductData(name, 12, 'monthly');
            const yearly = generateProductData(name, 5, 'yearly');
            
            const totalRevenue = monthly.reduce((sum, d) => sum + d.revenue, 0);
            const totalUnits = monthly.reduce((sum, d) => sum + d.units, 0);
            const totalOrders = monthly.reduce((sum, d) => sum + d.orders, 0);
            const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const growthRate = monthly.length > 1 ? 
                ((monthly[monthly.length - 1].revenue - monthly[0].revenue) / monthly[0].revenue * 100) : 0;
            
            productPerformance[name] = {
                daily,
                weekly,
                monthly,
                yearly,
                metrics: {
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    totalUnits: Math.round(totalUnits),
                    totalOrders: Math.round(totalOrders),
                    averageOrderValue: Math.round(avgOrderValue * 100) / 100,
                    growthRate: Math.round(growthRate * 10) / 10,
                    category: categories[index % categories.length],
                    stockLevel: Math.round(Math.random() * 1000 + 50),
                    reorderPoint: Math.round(Math.random() * 200 + 30)
                }
            };
            
            productMetrics.push({
                name,
                revenue: totalRevenue,
                units: totalUnits,
                orders: totalOrders,
                growthRate: growthRate,
                category: categories[index % categories.length]
            });
        });

        const sortedByRevenue = [...productMetrics].sort((a, b) => b.revenue - a.revenue);
        const topProducts = sortedByRevenue.slice(0, 3);
        const bottomProducts = sortedByRevenue.slice(-3).reverse();

        return {
            daily: [],
            weekly: [],
            monthly: [],
            yearly: [],
            productPerformance,
            topProducts,
            bottomProducts,
            summary: {
                totalProducts: productNames.length,
                totalRevenue: productMetrics.reduce((sum, p) => sum + p.revenue, 0),
                totalUnits: productMetrics.reduce((sum, p) => sum + p.units, 0),
                totalOrders: productMetrics.reduce((sum, p) => sum + p.orders, 0),
                averageGrowth: productMetrics.reduce((sum, p) => sum + p.growthRate, 0) / productMetrics.length
            }
        };
    };

    // =====================================================
    // CRUD OPERATIONS
    // =====================================================
    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/products', {
                ...formData,
                unit_price: parseFloat(formData.unit_price),
                stock_quantity: parseInt(formData.stock_quantity),
                min_stock_threshold: parseInt(formData.min_stock_threshold),
                unit_cost: parseFloat(formData.unit_cost)
            });
            toast.success('Product added successfully');
            setShowAddModal(false);
            resetForm();
            refreshTable();
        } catch (error) {
            toast.error('Failed to add product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProduct = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.put(`/api/products/${selectedProduct.id}`, {
                ...formData,
                unit_price: parseFloat(formData.unit_price),
                stock_quantity: parseInt(formData.stock_quantity),
                min_stock_threshold: parseInt(formData.min_stock_threshold),
                unit_cost: parseFloat(formData.unit_cost)
            });
            toast.success('Product updated successfully');
            setShowEditModal(false);
            resetForm();
            refreshTable();
        } catch (error) {
            toast.error('Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`/api/products/${id}`);
            toast.success('Product deleted successfully');
            refreshTable();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            unit_price: '',
            stock_quantity: '',
            min_stock_threshold: '',
            unit_cost: '',
            sku: ''
        });
        setSelectedProduct(null);
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            unit_price: product.unit_price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            min_stock_threshold: product.min_stock_threshold.toString(),
            unit_cost: product.unit_cost.toString(),
            sku: product.sku || ''
        });
        setShowEditModal(true);
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                             product.category.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || product.category === filters.category;
        const matchesStock = (!filters.minStock || product.stock_quantity >= parseInt(filters.minStock)) &&
                            (!filters.maxStock || product.stock_quantity <= parseInt(filters.maxStock));
        return matchesSearch && matchesCategory && matchesStock;
    });

    const categories = [...new Set(products.map(p => p.category))];

    const getProductMetrics = (productName) => {
        if (!productName) return null;
        const productData = reportData.productPerformance[productName];
        if (!productData) return null;
        return productData.metrics || null;
    };

    const periodOptions = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'yearly', label: 'Yearly' },
    ];

    const viewOptions = [
        { id: 'all', label: 'All Products', icon: <Layers size={14} /> },
        { id: 'top', label: 'Top Performers', icon: <Crown size={14} /> },
        { id: 'bottom', label: 'Bottom Performers', icon: <TrendingDown size={14} /> },
        { id: 'individual', label: 'Individual Product', icon: <Package size={14} /> },
    ];

    // =====================================================
    // SUMMARY STATISTICS
    // =====================================================
    const summary = useMemo(() => {
        if (!products || products.length === 0) {
            return { total: 0, categories: 0, lowStock: 0, totalValue: 0 };
        }
        
        const total = products.length;
        const categories = new Set(products.map(p => p.category)).size;
        const lowStock = products.filter(p => p.stock_quantity < p.min_stock_threshold).length;
        const totalValue = products.reduce((sum, p) => sum + (p.unit_cost * p.stock_quantity), 0);
        
        return { total, categories, lowStock, totalValue };
    }, [products]);

    // =====================================================
    // RENDER: PRODUCTS LIST
    // =====================================================
    const renderProductList = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { icon: Package, color: 'blue', label: 'Total Products', value: summary.total, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                    { icon: Tag, color: 'purple', label: 'Categories', value: summary.categories, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                    { icon: AlertCircle, color: 'red', label: 'Low Stock Items', value: summary.lowStock, bgColor: 'bg-red-100', iconColor: 'text-red-600' },
                    { icon: DollarSign, color: 'green', label: 'Total Stock Value', value: formatCurrency(summary.totalValue), bgColor: 'bg-green-100', iconColor: 'text-green-600' }
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
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Search products..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({...filters, category: e.target.value})}
                                className="rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="number"
                            placeholder="Min Stock"
                            value={filters.minStock}
                            onChange={(e) => setFilters({...filters, minStock: e.target.value})}
                            className="w-24 rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                            type="number"
                            placeholder="Max Stock"
                            value={filters.maxStock}
                            onChange={(e) => setFilters({...filters, maxStock: e.target.value})}
                            className="w-24 rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                            onClick={() => setFilters({search: '', category: '', minStock: '', maxStock: ''})}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No products found</p>
                                        <p className="text-xs">Try adjusting your filters or add a new product</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product, index) => {
                                    const isLowStock = product.stock_quantity < product.min_stock_threshold;
                                    return (
                                        <motion.tr 
                                            key={`${product.id}-${tableRefreshKey}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${isLowStock ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
                                                        <Package className={`h-5 w-5 ${isLowStock ? 'text-red-600' : 'text-blue-600'}`} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                {formatCurrency(product.unit_price)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                {formatCurrency(product.unit_cost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className={`text-sm font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {formatNumber(product.stock_quantity)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {isLowStock ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => openEditModal(product)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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
                <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
                    Showing {filteredProducts.length} of {products.length} products
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: PRODUCTS REPORT
    // =====================================================
    const renderProductReport = () => {
        const productNames = Object.keys(reportData.productPerformance || {});
        
        if (productNames.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No product data available</p>
                        <p className="text-xs">Add products to start tracking performance</p>
                    </div>
                </div>
            );
        }

        // Prepare data based on view
        let displayProducts = [];
        let chartTitle = 'All Products Performance';
        
        if (reportView === 'top') {
            displayProducts = reportData.topProducts || [];
            chartTitle = 'Top Performing Products';
        } else if (reportView === 'bottom') {
            displayProducts = reportData.bottomProducts || [];
            chartTitle = 'Bottom Performing Products';
        } else if (reportView === 'individual' && selectedReportProduct) {
            displayProducts = [{ 
                name: selectedReportProduct.name, 
                revenue: getProductMetrics(selectedReportProduct.name)?.totalRevenue || 0,
                units: getProductMetrics(selectedReportProduct.name)?.totalUnits || 0,
                orders: getProductMetrics(selectedReportProduct.name)?.totalOrders || 0,
                growthRate: getProductMetrics(selectedReportProduct.name)?.growthRate || 0
            }];
            chartTitle = `${selectedReportProduct.name} Performance`;
        } else {
            displayProducts = productNames.map(name => ({
                name,
                revenue: getProductMetrics(name)?.totalRevenue || 0,
                units: getProductMetrics(name)?.totalUnits || 0,
                orders: getProductMetrics(name)?.totalOrders || 0,
                growthRate: getProductMetrics(name)?.growthRate || 0
            })).sort((a, b) => b.revenue - a.revenue);
        }

        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
            >
                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        { icon: DollarSign, color: 'blue', label: 'Total Revenue', value: formatCurrency(reportData.summary?.totalRevenue || 0), bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                        { icon: ShoppingBag, color: 'green', label: 'Total Units Sold', value: formatNumber(reportData.summary?.totalUnits || 0), bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                        { icon: Users, color: 'purple', label: 'Total Orders', value: formatNumber(reportData.summary?.totalOrders || 0), bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                        { icon: TrendingUp, color: 'orange', label: 'Avg Growth Rate', value: `${(reportData.summary?.averageGrowth || 0) >= 0 ? '+' : ''}${reportData.summary?.averageGrowth?.toFixed(1) || 0}%`, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' }
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

                {/* Report Controls */}
                <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Period Filter */}
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {periodOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setReportPeriod(option.id)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                        reportPeriod === option.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        {/* View Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            {viewOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setReportView(option.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition ${
                                        reportView === option.id
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.icon}
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {reportView === 'individual' && (
                            <>
                                <div className="w-px h-6 bg-gray-200"></div>
                                <div className="flex-1 min-w-[150px]">
                                    <select
                                        value={selectedReportProduct?.id || ''}
                                        onChange={(e) => {
                                            const product = products.find(p => p.id === parseInt(e.target.value));
                                            setSelectedReportProduct(product);
                                        }}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="flex-1"></div>
                        <button 
                            onClick={refreshTable}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Download">
                            <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Print">
                            <Printer className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Bar Chart - Product Comparison */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        {chartTitle} - {reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)}
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={displayProducts} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip 
                                formatter={(value, name) => {
                                    if (name === 'revenue') return formatCurrency(value);
                                    if (name === 'units' || name === 'orders') return formatNumber(value);
                                    if (name === 'growthRate') return `${value}%`;
                                    return value;
                                }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="units" fill="#8b5cf6" name="Units" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Top vs Bottom Products */}
                {reportView === 'all' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                Top 3 Products by Revenue
                            </h3>
                            <div className="space-y-3">
                                {(reportData.topProducts || []).map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                index === 0 ? 'bg-yellow-500' :
                                                index === 1 ? 'bg-gray-400' :
                                                'bg-orange-400'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-400">{product.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-blue-600">{formatCurrency(product.revenue)}</p>
                                            <p className="text-xs text-green-600">+{product.growthRate?.toFixed(1) || 0}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                Bottom 3 Products by Revenue
                            </h3>
                            <div className="space-y-3">
                                {(reportData.bottomProducts || []).map((product, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                index === 0 ? 'bg-red-500' :
                                                index === 1 ? 'bg-yellow-500' :
                                                'bg-orange-400'
                                            }`}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-400">{product.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm text-red-600">{formatCurrency(product.revenue)}</p>
                                            <p className="text-xs text-red-500">{product.growthRate?.toFixed(1) || 0}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Breakdown */}
                {reportView === 'all' && (
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-purple-500" />
                            Revenue by Category
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResponsiveContainer width="100%" height={220}>
                                <RePieChart>
                                    <Pie
                                        data={Object.values(reportData.productPerformance || {}).reduce((acc, curr) => {
                                            const existing = acc.find(a => a.name === curr.metrics?.category);
                                            if (existing) {
                                                existing.value += curr.metrics?.totalRevenue || 0;
                                            } else {
                                                acc.push({ 
                                                    name: curr.metrics?.category || 'Unknown', 
                                                    value: curr.metrics?.totalRevenue || 0 
                                                });
                                            }
                                            return acc;
                                        }, [])}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {Object.values(reportData.productPerformance || {}).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                </RePieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col justify-center gap-2">
                                {Object.values(reportData.productPerformance || {}).reduce((acc, curr) => {
                                    const existing = acc.find(a => a.name === curr.metrics?.category);
                                    if (existing) {
                                        existing.value += curr.metrics?.totalRevenue || 0;
                                    } else {
                                        acc.push({ 
                                            name: curr.metrics?.category || 'Unknown', 
                                            value: curr.metrics?.totalRevenue || 0 
                                        });
                                    }
                                    return acc;
                                }, []).sort((a, b) => b.value - a.value).map((item, index) => (
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
                )}
            </motion.div>
        );
    };

    // =====================================================
    // MAIN RENDER
    // =====================================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

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
                        <Package className="h-7 w-7 mr-2 text-blue-500" />
                        Products
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage your product inventory and track performance
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
                        onClick={() => {
                            resetForm();
                            setShowAddModal(true);
                        }}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                    </motion.button>
                </div>
            </motion.div>

            {/* Tabs */}
            <motion.div variants={itemVariants} className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                            activeTab === 'list'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <List className="h-5 w-5 mr-2" />
                        Products List
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                            activeTab === 'reports'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Products Report
                    </button>
                </nav>
            </motion.div>

            {/* Tab Content */}
            {activeTab === 'list' ? renderProductList() : renderProductReport()}

            {/* ============================================ */}
            {/* ADD PRODUCT MODAL */}
            {/* ============================================ */}
            <AnimatePresence>
                {showAddModal && (
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
                                onClick={() => setShowAddModal(false)}
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
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-blue-100 p-2 mr-3">
                                                <Plus className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">Add Product</h3>
                                                <p className="text-sm text-gray-600">Enter product details</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAddModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddProduct}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="Enter product name"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="e.g., Bricks"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SKU
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="e.g., BRK-001"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit Price (R) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={formData.unit_price}
                                                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit Cost (R) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={formData.unit_cost}
                                                    onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Stock Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.stock_quantity}
                                                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Min Stock Threshold *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.min_stock_threshold}
                                                    onChange={(e) => setFormData({...formData, min_stock_threshold: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    placeholder="500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddModal(false)}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center">
                                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                                        Adding...
                                                    </span>
                                                ) : (
                                                    'Add Product'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================ */}
            {/* EDIT PRODUCT MODAL */}
            {/* ============================================ */}
            <AnimatePresence>
                {showEditModal && selectedProduct && (
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
                                onClick={() => setShowEditModal(false)}
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
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="rounded-lg bg-blue-100 p-2 mr-3">
                                                <Edit className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">Edit Product</h3>
                                                <p className="text-sm text-gray-600">Update product details</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowEditModal(false)}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleEditProduct}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Product Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    SKU
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.sku}
                                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit Price (R) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={formData.unit_price}
                                                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit Cost (R) *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    step="0.01"
                                                    value={formData.unit_cost}
                                                    onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Stock Quantity *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.stock_quantity}
                                                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Min Stock Threshold *
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.min_stock_threshold}
                                                    onChange={(e) => setFormData({...formData, min_stock_threshold: e.target.value})}
                                                    className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowEditModal(false)}
                                                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center">
                                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                                        Updating...
                                                    </span>
                                                ) : (
                                                    'Update Product'
                                                )}
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