//frontend/src/pages/Dashboard.jsx
import React, { useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';  // ADD THIS IMPORT
import { motion } from 'framer-motion';
import { 
    TrendingUp, TrendingDown, Package, DollarSign, AlertCircle, 
    ShoppingCart, Calendar, Truck, CheckCircle, Clock,
    BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Plus,
    FileText, Users, Building2
} from 'lucide-react';
// recharts is ~360 KB and sits below the fold. Loading the chart components
// lazily lets the headline figures paint immediately while the charting library
// arrives in the background.
const RevenueChart = lazy(() => import('../components/Charts/RevenueChart'));
const ProductPerformanceChart = lazy(() => import('../components/Charts/ProductPerformanceChart'));
const ExpensePieChart = lazy(() => import('../components/Charts/ExpensePieChart'));

const ChartFallback = () => (
    <div className="animate-pulse bg-gray-200/70 rounded" style={{ height: 220 }} />
);
import { parseNumber, parseIntSafe, parseStats, parseOrders, formatCurrency } from '../utils/parsers';
import { useApi } from '../hooks/useQuery';
import { SkeletonStatCards, SkeletonTable } from '../components/Skeletons';

export default function Dashboard() {
    // Each panel is its own query. Two consequences that matter:
    //
    //  1. They fail independently. The old Promise.all meant one 502 on any of
    //     the five calls blanked the entire dashboard; now a struggling endpoint
    //     costs you that one card.
    //  2. Each paints from cache on the first render, so returning to the
    //     dashboard shows last-known figures instantly and updates underneath.
    const statsQuery = useApi('/api/dashboard/stats', { refreshMs: 60000 });
    const ordersQuery = useApi('/api/dashboard/recent-orders', { refreshMs: 60000 });
    const revenueQuery = useApi('/api/dashboard/chart-revenue-expenses');
    const productQuery = useApi('/api/dashboard/chart-product-sales');
    const expenseQuery = useApi('/api/dashboard/chart-expense-categories');

    const stats = useMemo(
        () => parseStats(statsQuery.data || {}),
        [statsQuery.data]
    );
    const recentOrders = useMemo(
        () => parseOrders(ordersQuery.data || []),
        [ordersQuery.data]
    );
    const revenueData = useMemo(
        () =>
            (revenueQuery.data || []).map((item) => ({
                ...item,
                revenue: parseNumber(item.revenue),
                expenses: parseNumber(item.expenses),
            })),
        [revenueQuery.data]
    );
    const productSales = useMemo(
        () =>
            (productQuery.data || []).map((item) => ({
                ...item,
                total_sold: parseIntSafe(item.total_sold),
                total_revenue: parseNumber(item.total_revenue),
            })),
        [productQuery.data]
    );
    const expenseCategories = useMemo(
        () =>
            (expenseQuery.data || []).map((item) => ({
                ...item,
                total: parseNumber(item.total),
            })),
        [expenseQuery.data]
    );

    // "Loading" now means only: we have never successfully loaded these figures
    // on this device. Any cached copy skips this entirely.
    const showStatsSkeleton = statsQuery.isLoading;

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
            {showStatsSkeleton ? <SkeletonStatCards /> : <div className="grid-stats">
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
            </div>}

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
                        {revenueQuery.isLoading
                            ? <ChartFallback />
                            : <Suspense fallback={<ChartFallback />}><RevenueChart data={revenueData} /></Suspense>}
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
                        {expenseQuery.isLoading
                            ? <ChartFallback />
                            : <Suspense fallback={<ChartFallback />}><ExpensePieChart data={expenseCategories} /></Suspense>}
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
                        {productQuery.isLoading
                            ? <ChartFallback />
                            : <Suspense fallback={<ChartFallback />}><ProductPerformanceChart data={productSales} /></Suspense>}
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
                    {ordersQuery.isLoading ? <SkeletonTable rows={5} cols={5} /> : (
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
                    )}
                </div>
            </div>
        </div>
    );
}