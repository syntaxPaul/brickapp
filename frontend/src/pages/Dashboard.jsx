//frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';  // ADD THIS IMPORT
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Package, DollarSign, AlertCircle, 
    ShoppingCart, Calendar, Loader2, Truck, CheckCircle, Clock,
    BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Plus,
    FileText, Users, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import RevenueChart from '../components/Charts/RevenueChart';
import ProductPerformanceChart from '../components/Charts/ProductPerformanceChart';
import ExpensePieChart from '../components/Charts/ExpensePieChart';
import { parseNumber, parseIntSafe, parseStats, parseOrders, formatCurrency } from '../utils/parsers';

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_orders: 0,
        total_revenue: 0,
        total_expenses: 0,
        total_wastage_cost: 0,
        stock_alerts: [],
        delivery_stats: {
            total_trips: 0,
            completed_trips: 0,
            in_progress_trips: 0,
            scheduled_trips: 0
        }
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [productSales, setProductSales] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, ordersRes, revenueRes, productRes, expenseRes] = await Promise.all([
                axios.get('/api/dashboard/stats'),
                axios.get('/api/dashboard/recent-orders'),
                axios.get('/api/dashboard/chart-revenue-expenses'),
                axios.get('/api/dashboard/chart-product-sales'),
                axios.get('/api/dashboard/chart-expense-categories')
            ]);
            
            setStats(parseStats(statsRes.data));
            setRecentOrders(parseOrders(ordersRes.data));
            setRevenueData(revenueRes.data.map(item => ({
                ...item,
                revenue: parseNumber(item.revenue),
                expenses: parseNumber(item.expenses)
            })));
            setProductSales(productRes.data.map(item => ({
                ...item,
                total_sold: parseIntSafe(item.total_sold),
                total_revenue: parseNumber(item.total_revenue)
            })));
            setExpenseCategories(expenseRes.data.map(item => ({
                ...item,
                total: parseNumber(item.total)
            })));
        } catch (error) {
            toast.error('Failed to load dashboard data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const profit = stats.total_revenue - stats.total_expenses;
    const profitMargin = stats.total_revenue > 0 ? (profit / stats.total_revenue * 100) : 0;

    const quickActions = [
        { icon: <FileText size={18} />, label: 'New Order', color: 'blue' },
        { icon: <Plus size={18} />, label: 'Add Product', color: 'green' },
        { icon: <Users size={18} />, label: 'Add Customer', color: 'purple' },
        { icon: <Building2 size={18} />, label: 'New Branch', color: 'orange' },
    ];

    return (
        <div>
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-gray-500 text-sm">Overview of your business performance</p>
                </div>
                <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <button className="btn btn-outline text-sm">
                        <Calendar size={16} />
                        This Month
                    </button>
                    <button className="btn btn-primary text-sm">
                        <FileText size={16} />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid-stats">
                <motion.div whileHover={{ y: -2 }} className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Revenue</p>
                            <p className="stat-value">{formatCurrency(stats.total_revenue)}</p>
                            <p className="stat-change up">
                                <ArrowUpRight size={14} className="inline" />
                                12.5% from last month
                            </p>
                        </div>
                        <div className="stat-icon green">
                            <DollarSign size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Expenses</p>
                            <p className="stat-value">{formatCurrency(stats.total_expenses)}</p>
                            <p className="stat-change down">
                                <ArrowDownRight size={14} className="inline" />
                                8.3% from last month
                            </p>
                        </div>
                        <div className="stat-icon red">
                            <TrendingDown size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Net Profit</p>
                            <p className="stat-value">{formatCurrency(profit)}</p>
                            <p className="stat-change up">
                                <ArrowUpRight size={14} className="inline" />
                                {profitMargin.toFixed(1)}% margin
                            </p>
                        </div>
                        <div className="stat-icon blue">
                            <TrendingUp size={22} />
                        </div>
                    </div>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} className="stat-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="stat-label">Total Orders</p>
                            <p className="stat-value">{stats.total_orders}</p>
                            <p className="stat-change up">
                                <ArrowUpRight size={14} className="inline" />
                                23 orders this month
                            </p>
                        </div>
                        <div className="stat-icon purple">
                            <ShoppingCart size={22} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 mb-6">
                {quickActions.map((action, i) => (
                    <button
                        key={i}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition hover:shadow-md ${
                            action.color === 'blue' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' :
                            action.color === 'green' ? 'border-green-200 text-green-700 hover:bg-green-50' :
                            action.color === 'purple' ? 'border-purple-200 text-purple-700 hover:bg-purple-50' :
                            'border-orange-200 text-orange-700 hover:bg-orange-50'
                        }`}
                    >
                        {action.icon}
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid-charts">
                <div className="card">
                    <div className="card-header">
                        <h3 className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-blue-500" />
                            Revenue vs Expenses
                        </h3>
                        <span className="text-xs text-gray-400">Last 6 months</span>
                    </div>
                    <div className="card-body">
                        <RevenueChart data={revenueData} />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3 className="flex items-center gap-2">
                            <PieChart size={18} className="text-green-500" />
                            Expenses by Category
                        </h3>
                        <span className="text-xs text-gray-400">This month</span>
                    </div>
                    <div className="card-body">
                        <ExpensePieChart data={expenseCategories} />
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Product Performance */}
                <div className="card lg:col-span-2">
                    <div className="card-header">
                        <h3 className="flex items-center gap-2">
                            <Package size={18} className="text-purple-500" />
                            Top Products
                        </h3>
                        <span className="text-xs text-gray-400">By revenue</span>
                    </div>
                    <div className="card-body">
                        <ProductPerformanceChart data={productSales} />
                    </div>
                </div>

                {/* Stock Alerts & Wastage */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="flex items-center gap-2">
                            <AlertCircle size={18} className="text-yellow-500" />
                            Stock Alerts
                        </h3>
                        <span className="text-xs text-gray-400">{stats.stock_alerts?.length || 0} alerts</span>
                    </div>
                    <div className="card-body">
                        {stats.stock_alerts?.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-600 text-sm">
                                <CheckCircle size={16} />
                                All products above threshold
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {stats.stock_alerts.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                                        <span className="text-sm font-medium">{item.name}</span>
                                        <span className="text-xs font-bold text-red-600">
                                            {item.stock_quantity} / {item.min_stock_threshold}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Wastage Cost</span>
                                <span className="text-sm font-bold text-red-600">{formatCurrency(stats.total_wastage_cost)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="card mt-6">
                <div className="card-header">
                    <h3 className="flex items-center gap-2">
                        <Clock size={18} className="text-gray-500" />
                        Recent Orders
                    </h3>
                    <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View All →
                    </Link>
                </div>
                <div className="card-body p-0">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.slice(0, 5).map((order) => (
                                    <tr key={order.id}>
                                        <td className="font-medium">#{order.id}</td>
                                        <td>{order.customer_name}</td>
                                        <td>{new Date(order.order_date).toLocaleDateString()}</td>
                                        <td>{formatCurrency(order.total_amount)}</td>
                                        <td>
                                            <span className={`badge ${
                                                order.status === 'Delivered' ? 'badge-success' :
                                                order.status === 'Dispatched' ? 'badge-info' :
                                                order.status === 'Production' ? 'badge-warning' :
                                                'badge-neutral'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}