//frontend/src/pages/Deliveries.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Truck, Plus, CheckCircle, Clock, MapPin, 
    User, Phone, Mail, Loader2, Eye, Calendar, Fuel, Play,
    BarChart3, PieChart, LineChart, Download, Printer,
    RefreshCw, Filter, Search, Edit, Trash2,
    AlertTriangle, Info, Activity, Zap, Target, Award,
    Crown, Medal, Users, ChevronDown, ChevronUp,
    X, Layers, List, Grid, FileText, DollarSign,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    Navigation, Compass, Gauge, Timer, Fuel as FuelIcon,
    Receipt, CreditCard, Clock as ClockIcon, CheckSquare,
    Package, Truck as TruckIcon, Palette, Boxes,
    Calendar as CalendarIcon, Building2, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseNumber, parseIntSafe, parseOrders, parseDeliveryTrips } from '../utils/parsers';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, LineChart as ReLineChart, Line,
    PieChart as RePieChart, Pie, Cell,
    ComposedChart, Area, AreaChart,
    ScatterChart, Scatter, ZAxis
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
// DELIVERY METRICS COMPONENT
// =====================================================
const DeliveryMetrics = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No delivery data available</p>
                <p className="text-xs">Deliveries will appear here once orders with delivery are created</p>
            </div>
        );
    }

    const totalDeliveries = data.length;
    const delivered = data.filter(d => d.status === 'Delivered').length;
    const notDelivered = data.filter(d => d.status !== 'Delivered' && d.status !== 'Cancelled').length;
    const totalPallets = data.reduce((sum, d) => sum + (parseIntSafe(d.pallets) || 0), 0);
    const truckCapacity = 10;
    const tripsNeeded = Math.ceil(totalPallets / truckCapacity);

    const metrics = [
        { 
            label: 'Total Deliveries', 
            value: totalDeliveries, 
            icon: <Truck className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        { 
            label: 'Delivered', 
            value: delivered, 
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        { 
            label: 'Pending', 
            value: notDelivered, 
            icon: <Clock className="h-5 w-5" />,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        { 
            label: 'Total Pallets', 
            value: totalPallets, 
            icon: <Boxes className="h-5 w-5" />,
            color: 'purple',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600'
        },
        { 
            label: 'Trips Required', 
            value: tripsNeeded, 
            icon: <Navigation className="h-5 w-5" />,
            color: 'indigo',
            bgColor: 'bg-indigo-100',
            iconColor: 'text-indigo-600'
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
// MAIN DELIVERIES COMPONENT
// =====================================================
export default function Deliveries() {
    // =====================================================
    // STATE
    // =====================================================
    const [deliveries, setDeliveries] = useState([]);
    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('deliveries');
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [showTripModal, setShowTripModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'delivery_date', direction: 'desc' });
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editingDelivery, setEditingDelivery] = useState(null);

    // Report State
    const [reportPeriod, setReportPeriod] = useState('weekly');
    const [reportData, setReportData] = useState({
        daily: [],
        weekly: [],
        monthly: [],
        driverPerformance: [],
        vehiclePerformance: [],
        statusBreakdown: [],
        summary: {
            totalTrips: 0,
            completedTrips: 0,
            totalDistance: 0,
            totalFuel: 0,
            avgDistance: 0,
            avgFuel: 0,
            completionRate: 0,
            onTimeRate: 0
        }
    });
    const [reportLoading, setReportLoading] = useState(false);

    // Form State - Delivery
    const [newDelivery, setNewDelivery] = useState({
        order_id: '',
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        product_name: '',
        product_color: '',
        quantity: '',
        pallets: '',
        order_date: '',
        delivery_date: '',
        status: 'Pending',
        notes: ''
    });

    // Form State - Trip
    const [newTrip, setNewTrip] = useState({
        delivery_id: '',
        driver_id: '',
        vehicle_registration: '',
        vehicle_type: '',
        trip_date: '',
        departure_time: '',
        status: 'Scheduled',
        delivery_notes: ''
    });

    // Form State - Driver
    const [newDriver, setNewDriver] = useState({
        name: '',
        surname: '',
        phone: '',
        email: '',
        license_number: '',
        license_expiry: '',
        employee_id: '',
        status: 'Active',
        hire_date: ''
    });

    // Sample products with colors
    const productOptions = [
        { name: 'Standard Brick', colors: ['Red', 'Brown', 'Buff'] },
        { name: 'Face Brick', colors: ['Red', 'Buff', 'Grey'] },
        { name: 'Paving Block', colors: ['Black', 'Grey', 'Red', 'Charcoal'] },
        { name: 'Concrete Block', colors: ['Grey', 'White'] },
        { name: 'Premium Brick', colors: ['Red', 'Brown', 'Charcoal'] },
        { name: 'Cement 50kg', colors: ['Grey'] },
        { name: 'River Sand', colors: ['Brown'] },
        { name: 'Mortar Mix', colors: ['Grey'] }
    ];

    const statusOptions = ['Pending', 'In Progress', 'Delivered', 'Cancelled'];

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
            const [deliveriesRes, tripsRes, driversRes, ordersRes, productsRes] = await Promise.all([
                axios.get('/api/deliveries'),
                axios.get('/api/deliveries/trips'),
                axios.get('/api/deliveries/drivers'),
                axios.get('/api/orders'),
                axios.get('/api/products')
            ]);
            
            // Parse deliveries and link to orders
            const parsedDeliveries = deliveriesRes.data.map(d => ({
                ...d,
                pallets: parseIntSafe(d.pallets) || calculatePallets(d.quantity, d.product_name),
                quantity: parseIntSafe(d.quantity),
                // Link to order if available
                order: ordersRes.data.find(o => o.id === d.order_id)
            }));
            
            setDeliveries(parsedDeliveries);
            setTrips(parseDeliveryTrips(tripsRes.data));
            setDrivers(driversRes.data.map(d => ({
                ...d,
                total_trips: parseIntSafe(d.total_trips),
                completed_trips: parseIntSafe(d.completed_trips)
            })));
            setOrders(parseOrders(ordersRes.data));
            setProducts(productsRes.data);
        } catch (error) {
            console.error('Failed to load delivery data:', error);
            toast.error('Failed to load delivery data');
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
    // HELPERS
    // =====================================================
    const calculatePallets = (quantity, productName) => {
        const qty = parseIntSafe(quantity);
        if (!qty) return 0;
        
        // Small bricks: 500 per pallet, Large bricks: 50 per pallet
        const smallBrickKeywords = ['brick', 'paving', 'block'];
        const isSmall = smallBrickKeywords.some(keyword => 
            productName?.toLowerCase().includes(keyword)
        );
        
        const perPallet = isSmall ? 500 : 50;
        return Math.ceil(qty / perPallet);
    };

    const getStatusColor = (status) => {
        const colors = {
            'Delivered': 'bg-green-100 text-green-700',
            'In Progress': 'bg-blue-100 text-blue-700',
            'Pending': 'bg-yellow-100 text-yellow-700',
            'Cancelled': 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'Delivered': return <CheckCircle className="h-3 w-3" />;
            case 'In Progress': return <Play className="h-3 w-3" />;
            case 'Pending': return <Clock className="h-3 w-3" />;
            case 'Cancelled': return <X className="h-3 w-3" />;
            default: return <AlertCircle className="h-3 w-3" />;
        }
    };

    const handleReportPeriodChange = (period) => {
        setReportPeriod(period);
        generateReportData(period);
    };

    const generateReportData = (period) => {
        setReportLoading(true);
        // Use delivery data for reports
        const tripData = trips.length > 0 ? trips : generateSampleTrips();

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
            
            const dayTrips = tripData.filter(t => {
                const tripDate = new Date(t.trip_date);
                return tripDate.toDateString() === date.toDateString();
            });

            const completed = dayTrips.filter(t => t.status === 'Completed').length;
            const totalDist = dayTrips.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0);
            const avgDist = dayTrips.length > 0 ? totalDist / dayTrips.length : 0;

            return {
                label: date.toLocaleDateString('en-ZA', { 
                    month: 'short', 
                    day: period === 'daily' || period === 'weekly' ? 'numeric' : undefined,
                    year: period === 'monthly' ? 'numeric' : undefined
                }),
                trips: dayTrips.length,
                completed,
                totalDistance: totalDist,
                avgDistance: avgDist,
                date
            };
        });

        // Driver performance
        const driverPerformance = drivers.map(driver => {
            const driverTrips = tripData.filter(t => t.driver_id === driver.id);
            const completed = driverTrips.filter(t => t.status === 'Completed').length;
            const totalDist = driverTrips.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0);
            const avgDist = driverTrips.length > 0 ? totalDist / driverTrips.length : 0;
            
            return {
                name: `${driver.name} ${driver.surname}`,
                trips: driverTrips.length,
                completed,
                totalDistance: totalDist,
                avgDistance: avgDist,
                completionRate: driverTrips.length > 0 ? (completed / driverTrips.length * 100) : 0
            };
        });

        // Vehicle performance
        const vehicleTypes = ['Flatbed', 'Tipper', 'Truck', 'Van'];
        const vehiclePerformance = vehicleTypes.map(type => {
            const typeTrips = tripData.filter(t => t.vehicle_type === type);
            const completed = typeTrips.filter(t => t.status === 'Completed').length;
            const totalDist = typeTrips.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0);
            
            return {
                name: type,
                trips: typeTrips.length,
                completed,
                totalDistance: totalDist,
                completionRate: typeTrips.length > 0 ? (completed / typeTrips.length * 100) : 0
            };
        });

        // Status breakdown
        const statuses = ['Scheduled', 'In Progress', 'Completed', 'Delayed', 'Cancelled'];
        const statusBreakdown = statuses.map(status => ({
            name: status,
            value: tripData.filter(t => t.status === status).length
        }));

        // Summary stats
        const totalTrips = tripData.length;
        const completedTrips = tripData.filter(t => t.status === 'Completed').length;
        const totalDistance = tripData.reduce((sum, t) => sum + (parseFloat(t.distance_km) || 0), 0);
        const avgDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;
        const completionRate = totalTrips > 0 ? (completedTrips / totalTrips * 100) : 0;

        setReportData({
            daily: timeData,
            weekly: timeData,
            monthly: timeData,
            driverPerformance,
            vehiclePerformance,
            statusBreakdown,
            summary: {
                totalTrips,
                completedTrips,
                totalDistance,
                totalFuel: 0,
                avgDistance,
                avgFuel: 0,
                completionRate,
                onTimeRate: 85 + Math.random() * 10
            }
        });
        setReportLoading(false);
    };

    const generateSampleTrips = () => {
        const sampleTrips = [];
        const now = new Date();
        const statuses = ['Scheduled', 'In Progress', 'Completed', 'Completed', 'Completed', 'Completed'];
        const vehicleTypes = ['Flatbed', 'Tipper', 'Truck', 'Van'];
        const driverNames = ['John', 'Jane', 'Bob', 'Alice', 'Mike', 'Sarah', 'David', 'Lisa'];
        const customerNames = ['ABC Construction', 'XYZ Developers', 'PTA Builders', 'JHB Construction', 'Sandton Projects'];
        
        for (let i = 0; i < 20; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const driverIdx = i % driverNames.length;
            const customerIdx = i % customerNames.length;
            const dist = Math.round((10 + Math.random() * 90) * 10) / 10;
            
            sampleTrips.push({
                id: i + 1,
                delivery_id: i + 1,
                driver_id: driverIdx + 1,
                driver_name: driverNames[driverIdx],
                driver_surname: ['Smith', 'Doe', 'Brown', 'Johnson', 'Wilson'][driverIdx % 5] || 'Unknown',
                customer_name: customerNames[customerIdx],
                vehicle_registration: `CK ${String(100 + i).padStart(3, '0')}-${String(10 + i).padStart(2, '0')}`,
                vehicle_type: vehicleTypes[i % vehicleTypes.length],
                trip_date: date.toISOString().split('T')[0],
                departure_time: `${String(6 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                return_time: status === 'Completed' ? `${String(14 + Math.floor(Math.random() * 8)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null,
                distance_km: dist,
                status: status,
                signature_received: status === 'Completed' ? Math.random() > 0.3 : false,
            });
        }
        return sampleTrips;
    };

    // =====================================================
    // DELIVERY CRUD OPERATIONS
    // =====================================================
    const handleCreateDelivery = async (e) => {
        e.preventDefault();
        try {
            const pallets = calculatePallets(newDelivery.quantity, newDelivery.product_name);
            const deliveryData = {
                ...newDelivery,
                quantity: parseIntSafe(newDelivery.quantity),
                pallets: pallets,
                // If order_id is provided, link it
                order_id: newDelivery.order_id || null
            };
            await axios.post('/api/deliveries', deliveryData);
            toast.success('Delivery created successfully!');
            setShowDeliveryModal(false);
            resetDeliveryForm();
            refreshData();
        } catch (error) {
            console.error('Failed to create delivery:', error);
            toast.error('Failed to create delivery');
        }
    };

    const handleUpdateDelivery = async (e) => {
        e.preventDefault();
        try {
            const pallets = calculatePallets(newDelivery.quantity, newDelivery.product_name);
            const deliveryData = {
                ...newDelivery,
                quantity: parseIntSafe(newDelivery.quantity),
                pallets: pallets
            };
            await axios.put(`/api/deliveries/${editingDelivery.id}`, deliveryData);
            toast.success('Delivery updated successfully!');
            setShowDeliveryModal(false);
            setEditingDelivery(null);
            resetDeliveryForm();
            refreshData();
        } catch (error) {
            console.error('Failed to update delivery:', error);
            toast.error('Failed to update delivery');
        }
    };

    const handleDeleteDelivery = async (id) => {
        if (!confirm('Are you sure you want to delete this delivery?')) return;
        try {
            await axios.delete(`/api/deliveries/${id}`);
            toast.success('Delivery deleted successfully');
            refreshData();
        } catch (error) {
            console.error('Failed to delete delivery:', error);
            toast.error('Failed to delete delivery');
        }
    };

    const handleEditDelivery = (delivery) => {
        setEditingDelivery(delivery);
        setNewDelivery({
            order_id: delivery.order_id || '',
            customer_name: delivery.customer_name || '',
            customer_phone: delivery.customer_phone || '',
            customer_address: delivery.customer_address || '',
            product_name: delivery.product_name || '',
            product_color: delivery.product_color || '',
            quantity: delivery.quantity?.toString() || '',
            pallets: delivery.pallets?.toString() || '',
            order_date: delivery.order_date || '',
            delivery_date: delivery.delivery_date || '',
            status: delivery.status || 'Pending',
            notes: delivery.notes || ''
        });
        setShowDeliveryModal(true);
    };

    const resetDeliveryForm = () => {
        setNewDelivery({
            order_id: '',
            customer_name: '',
            customer_phone: '',
            customer_address: '',
            product_name: '',
            product_color: '',
            quantity: '',
            pallets: '',
            order_date: '',
            delivery_date: '',
            status: 'Pending',
            notes: ''
        });
    };

    const viewDeliveryDetails = (delivery) => {
        setSelectedDelivery(delivery);
        setShowDetailModal(true);
    };

    // =====================================================
    // TRIP CRUD OPERATIONS
    // =====================================================
    const handleCreateTrip = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/deliveries/trips', newTrip);
            toast.success('Delivery trip created successfully!');
            setShowTripModal(false);
            setNewTrip({
                delivery_id: '',
                driver_id: '',
                vehicle_registration: '',
                vehicle_type: '',
                trip_date: '',
                departure_time: '',
                status: 'Scheduled',
                delivery_notes: ''
            });
            refreshData();
        } catch (error) {
            console.error('Failed to create trip:', error);
            toast.error('Failed to create trip');
        }
    };

    const handleCompleteTrip = async (tripId) => {
        const return_time = prompt('Enter return time (HH:MM):');
        if (!return_time) return;
        
        const distance_km = prompt('Enter distance (km):');
        if (!distance_km) return;
        
        const fuel_used = prompt('Enter fuel used (liters):');
        if (!fuel_used) return;
        
        const toll_cost = prompt('Enter toll cost (R):', '0');
        const signature = confirm('Was signature received?');
        
        try {
            await axios.put(`/api/deliveries/trips/${tripId}/complete`, {
                return_time,
                distance_km: parseFloat(distance_km),
                fuel_used_liters: parseFloat(fuel_used),
                toll_cost: parseFloat(toll_cost) || 0,
                signature_received: signature,
                delivery_notes: prompt('Add delivery notes (optional):') || ''
            });
            toast.success('Trip completed successfully!');
            refreshData();
        } catch (error) {
            console.error('Failed to complete trip:', error);
            toast.error('Failed to complete trip');
        }
    };

    const updateTripStatus = async (tripId, status) => {
        try {
            await axios.put(`/api/deliveries/trips/${tripId}/status`, { status });
            toast.success(`Trip ${status} started!`);
            refreshData();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
        }
    };

    const viewTripDetails = (trip) => {
        setSelectedTrip(trip);
        setShowDetailModal(true);
    };

    // =====================================================
    // DRIVER CRUD OPERATIONS
    // =====================================================
    const handleCreateDriver = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/deliveries/drivers', newDriver);
            toast.success('Driver added successfully!');
            setShowDriverModal(false);
            setNewDriver({
                name: '',
                surname: '',
                phone: '',
                email: '',
                license_number: '',
                license_expiry: '',
                employee_id: '',
                status: 'Active',
                hire_date: ''
            });
            refreshData();
        } catch (error) {
            console.error('Failed to create driver:', error);
            toast.error('Failed to create driver');
        }
    };

    const handleUpdateDriver = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/deliveries/drivers/${editingDriver.id}`, newDriver);
            toast.success('Driver updated successfully!');
            setShowDriverModal(false);
            setEditingDriver(null);
            setNewDriver({
                name: '',
                surname: '',
                phone: '',
                email: '',
                license_number: '',
                license_expiry: '',
                employee_id: '',
                status: 'Active',
                hire_date: ''
            });
            refreshData();
        } catch (error) {
            console.error('Failed to update driver:', error);
            toast.error('Failed to update driver');
        }
    };

    const handleDeleteDriver = async (id) => {
        if (!confirm('Are you sure you want to delete this driver?')) return;
        try {
            await axios.delete(`/api/deliveries/drivers/${id}`);
            toast.success('Driver deleted successfully');
            refreshData();
        } catch (error) {
            console.error('Failed to delete driver:', error);
            toast.error('Failed to delete driver');
        }
    };

    const handleEditDriver = (driver) => {
        setEditingDriver(driver);
        setNewDriver({
            name: driver.name,
            surname: driver.surname,
            phone: driver.phone || '',
            email: driver.email || '',
            license_number: driver.license_number || '',
            license_expiry: driver.license_expiry ? new Date(driver.license_expiry).toISOString().split('T')[0] : '',
            employee_id: driver.employee_id || '',
            status: driver.status,
            hire_date: driver.hire_date ? new Date(driver.hire_date).toISOString().split('T')[0] : ''
        });
        setShowDriverModal(true);
    };

    // =====================================================
    // FILTERS
    // =====================================================
    const filteredDeliveries = deliveries.filter(delivery => {
        const matchesSearch = delivery.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             delivery.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             delivery.product_color?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (delivery.order && `#${delivery.order.id}`.includes(searchQuery));
        const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
        const matchesDate = !dateFilter || delivery.delivery_date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (sortConfig.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
    });

    const filteredTrips = trips.filter(trip => {
        const matchesSearch = trip.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             trip.driver_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesDate = !dateFilter || trip.trip_date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const tabs = [
        { id: 'deliveries', label: 'Deliveries', icon: <Package size={16} /> },
        { id: 'trips', label: 'Trips', icon: <TruckIcon size={16} /> },
        { id: 'drivers', label: 'Drivers', icon: <Users size={16} /> },
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
    // RENDER: DELIVERIES TAB
    // =====================================================
    const renderDeliveriesTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <DeliveryMetrics data={deliveries} />

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
                            placeholder="Search deliveries by customer, product, or order #..."
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
                                {statusOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setDateFilter('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => {
                                setEditingDelivery(null);
                                resetDeliveryForm();
                                setShowDeliveryModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                        >
                            <Plus size={16} /> New Delivery
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'order_date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Order Date
                                        {sortConfig.key === 'order_date' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium">Order # / Customer</th>
                                <th className="py-3 px-4 font-medium">Product</th>
                                <th className="py-3 px-4 font-medium text-center">Color</th>
                                <th className="py-3 px-4 font-medium text-right">Qty</th>
                                <th className="py-3 px-4 font-medium text-right">Pallets</th>
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'delivery_date', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Delivery Date
                                        {sortConfig.key === 'delivery_date' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium text-center">Status</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredDeliveries.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-gray-400">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No deliveries found</p>
                                        <p className="text-xs">Deliveries are automatically created from orders with delivery option selected</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredDeliveries.map((delivery, index) => (
                                    <motion.tr 
                                        key={delivery.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4">
                                            {delivery.order_date ? new Date(delivery.order_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div>
                                                {delivery.order && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        #{delivery.order.id}
                                                    </span>
                                                )}
                                                <p className="font-medium text-gray-900">{delivery.customer_name}</p>
                                                <p className="text-xs text-gray-500">{delivery.customer_phone}</p>
                                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{delivery.customer_address}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-medium">{delivery.product_name}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {delivery.product_color && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    <span 
                                                        className="w-3 h-3 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: delivery.product_color.toLowerCase() }}
                                                    />
                                                    {delivery.product_color}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium">
                                            {delivery.quantity?.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                                <Boxes className="h-3 w-3" />
                                                {delivery.pallets || 0}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                                {getStatusIcon(delivery.status)}
                                                {delivery.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => viewDeliveryDetails(delivery)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDelivery(delivery)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDelivery(delivery.id)}
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
                    <span>Showing {filteredDeliveries.length} of {deliveries.length} deliveries</span>
                    <span>Total Pallets: <strong className="text-purple-600">{deliveries.reduce((sum, d) => sum + (d.pallets || 0), 0)}</strong></span>
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: TRIPS TAB
    // =====================================================
    const renderTripsTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Delivery Trips</h2>
                    <p className="text-sm text-gray-500">Manage delivery trips and track progress</p>
                </div>
                <button
                    onClick={() => setShowTripModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> New Trip
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium">Trip #</th>
                                <th className="py-3 px-4 font-medium">Delivery</th>
                                <th className="py-3 px-4 font-medium">Driver</th>
                                <th className="py-3 px-4 font-medium">Vehicle</th>
                                <th className="py-3 px-4 font-medium">Date</th>
                                <th className="py-3 px-4 font-medium text-right">Distance</th>
                                <th className="py-3 px-4 font-medium text-center">Status</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredTrips.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-gray-400">
                                        <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No trips found</p>
                                        <p className="text-xs">Create a new delivery trip to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTrips.map((trip, index) => (
                                    <motion.tr 
                                        key={trip.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="hover:bg-gray-50 transition"
                                    >
                                        <td className="py-3 px-4 font-medium text-gray-900">#{trip.id}</td>
                                        <td className="py-3 px-4">{trip.customer_name || `Delivery #${trip.delivery_id}`}</td>
                                        <td className="py-3 px-4">{trip.driver_name} {trip.driver_surname}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                {trip.vehicle_registration}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">{new Date(trip.trip_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4 text-right">{trip.distance_km ? `${trip.distance_km}km` : '-'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                                                {getStatusIcon(trip.status)}
                                                {trip.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => viewTripDetails(trip)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {trip.status === 'Scheduled' && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Mark this trip as In Progress?')) {
                                                                updateTripStatus(trip.id, 'In Progress');
                                                            }
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                        title="Start Trip"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                )}
                                                {trip.status === 'In Progress' && (
                                                    <button
                                                        onClick={() => handleCompleteTrip(trip.id)}
                                                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"
                                                        title="Complete Trip"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );

    // =====================================================
    // RENDER: DRIVERS TAB
    // =====================================================
    const renderDriversTab = () => (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Drivers Overview</h2>
                    <p className="text-sm text-gray-500">Manage delivery drivers and their status</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDriver(null);
                        setNewDriver({
                            name: '',
                            surname: '',
                            phone: '',
                            email: '',
                            license_number: '',
                            license_expiry: '',
                            employee_id: '',
                            status: 'Active',
                            hire_date: ''
                        });
                        setShowDriverModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> Add Driver
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {drivers.map((driver) => (
                    <motion.div
                        key={driver.id}
                        whileHover={{ y: -2 }}
                        className={`bg-white rounded-lg shadow-sm border-l-4 p-4 ${
                            driver.status === 'Active' ? 'border-green-500' :
                            driver.status === 'On Leave' ? 'border-yellow-500' :
                            'border-gray-400'
                        } border border-gray-200 hover:shadow-md transition`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {driver.name?.[0]}{driver.surname?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{driver.name} {driver.surname}</h3>
                                    <p className="text-xs text-gray-500">{driver.employee_id || 'No ID'}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                driver.status === 'Active' ? 'bg-green-100 text-green-700' :
                                driver.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                                {driver.status}
                            </span>
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Phone size={14} /> {driver.phone || 'No phone'}
                            </div>
                            {driver.email && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Mail size={14} /> {driver.email}
                                </div>
                            )}
                            {driver.license_number && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <CreditCard size={14} /> License: {driver.license_number}
                                </div>
                            )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Trips:</span>
                                <span className="font-medium block">{driver.total_trips || 0}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Completed:</span>
                                <span className="font-medium block text-green-600">{driver.completed_trips || 0}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-1">
                            <button
                                onClick={() => handleEditDriver(driver)}
                                className="flex-1 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs"
                            >
                                <Edit size={14} className="inline mr-1" /> Edit
                            </button>
                            <button
                                onClick={() => handleDeleteDriver(driver.id)}
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
    // RENDER: REPORTS TAB
    // =====================================================
    const renderReportsTab = () => {
        const { summary, driverPerformance, vehiclePerformance, statusBreakdown } = reportData;

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

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Trips', value: summary.totalTrips, icon: <Truck className="h-4 w-4" />, color: 'blue' },
                        { label: 'Completed', value: summary.completedTrips, icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
                        { label: 'Total Distance', value: `${summary.totalDistance?.toFixed(1) || 0}km`, icon: <Navigation className="h-4 w-4" />, color: 'indigo' },
                        { label: 'Avg Distance', value: `${summary.avgDistance?.toFixed(1) || 0}km`, icon: <Gauge className="h-4 w-4" />, color: 'purple' },
                        { label: 'Completion Rate', value: `${summary.completionRate?.toFixed(1) || 0}%`, icon: <TrendingUp className="h-4 w-4" />, color: 'green' }
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
                                Delivery Trend ({reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)})
                            </h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={reportData[reportPeriod] || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        formatter={(value, name) => {
                                            if (name === 'trips' || name === 'completed') return [value, name === 'trips' ? 'Total Trips' : 'Completed'];
                                            if (name === 'totalDistance') return [`${value.toFixed(1)}km`, 'Total Distance'];
                                            if (name === 'avgDistance') return [`${value.toFixed(1)}km`, 'Avg Distance'];
                                            return [value, name];
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="trips" fill="#3b82f6" name="Total Trips" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="avgDistance" stroke="#f59e0b" name="Avg Distance" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4 text-yellow-500" />
                                    Driver Performance
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                    {driverPerformance.slice(0, 8).map((driver, index) => (
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
                                                    <p className="font-medium text-sm">{driver.name}</p>
                                                    <p className="text-xs text-gray-400">{driver.trips} trips</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-blue-600">{driver.totalDistance?.toFixed(1) || 0}km</p>
                                                <p className={`text-xs ${driver.completionRate >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {driver.completionRate?.toFixed(1) || 0}% completion
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <PieChart className="h-4 w-4 text-purple-500" />
                                    Vehicle Type Performance
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ResponsiveContainer width="100%" height={200}>
                                        <RePieChart>
                                            <Pie
                                                data={vehiclePerformance}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="trips"
                                            >
                                                {vehiclePerformance.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${value} trips`} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                    <div className="flex flex-col justify-center gap-2">
                                        {vehiclePerformance.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-bold text-blue-600">{item.trips}</span>
                                                    <span className="text-xs text-gray-400 ml-1">trips</span>
                                                </div>
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
        const { summary } = reportData;
        
        const totalDeliveries = deliveries.length;
        const delivered = deliveries.filter(d => d.status === 'Delivered').length;
        const pending = deliveries.filter(d => d.status !== 'Delivered' && d.status !== 'Cancelled').length;
        const totalPallets = deliveries.reduce((sum, d) => sum + (d.pallets || 0), 0);
        const completionRate = totalDeliveries > 0 ? (delivered / totalDeliveries * 100) : 0;
        const truckCapacity = 10;
        const tripsNeeded = Math.ceil(totalPallets / truckCapacity);

        const insights = [
            {
                title: 'Delivery Completion Rate',
                value: `${completionRate.toFixed(1)}%`,
                description: completionRate >= 85 ? 'Excellent delivery completion rate.' : 
                           completionRate >= 70 ? 'Good completion rate. Room for improvement.' :
                           'Low completion rate. Review delivery processes.',
                color: completionRate >= 85 ? 'green' : completionRate >= 70 ? 'yellow' : 'red',
                icon: <CheckCircle className="h-6 w-6" />
            },
            {
                title: 'Total Pallets Delivered',
                value: totalPallets,
                description: `${tripsNeeded} trips needed with ${truckCapacity} pallet capacity.`,
                color: totalPallets > 0 ? 'blue' : 'gray',
                icon: <Boxes className="h-6 w-6" />
            },
            {
                title: 'Pending Deliveries',
                value: pending,
                description: pending === 0 ? 'All deliveries completed.' :
                           pending > 5 ? `${pending} deliveries need attention.` :
                           `${pending} deliveries pending.`,
                color: pending === 0 ? 'green' : pending > 5 ? 'red' : 'yellow',
                icon: <Clock className="h-6 w-6" />
            },
            {
                title: 'Delivery Efficiency',
                value: `${(summary.completionRate || 0).toFixed(1)}%`,
                description: summary.completionRate >= 80 ? 'Efficient delivery operations.' : 'Review delivery efficiency.',
                color: summary.completionRate >= 80 ? 'green' : 'yellow',
                icon: <Zap className="h-6 w-6" />
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
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        Delivery Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Total Deliveries</p>
                            <p className="text-xl font-bold">{totalDeliveries}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Delivered</p>
                            <p className="text-xl font-bold text-green-600">{delivered}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">{pending}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Pallets</p>
                            <p className="text-xl font-bold text-purple-600">{totalPallets}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                        <span className="text-gray-500">Completion Rate: <strong className="text-gray-900">{completionRate.toFixed(1)}%</strong></span>
                        <span className="text-gray-500">Trips Needed: <strong className="text-gray-900">{tripsNeeded}</strong></span>
                        <span className="text-gray-500">Avg Pallets/Trip: <strong className="text-gray-900">{totalDeliveries > 0 ? (totalPallets / totalDeliveries).toFixed(1) : 0}</strong></span>
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
                        <Truck className="h-7 w-7 mr-2 text-blue-500" />
                        Delivery Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage deliveries, track trips, and analyze performance
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
            {activeTab === 'deliveries' && renderDeliveriesTab()}
            {activeTab === 'trips' && renderTripsTab()}
            {activeTab === 'drivers' && renderDriversTab()}
            {activeTab === 'reports' && renderReportsTab()}
            {activeTab === 'insights' && renderInsightsTab()}

            {/* ===================================================== */}
            {/* DELIVERY MODAL (Add/Edit) */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showDeliveryModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Modal content - same as before but with order selection */}
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`rounded-lg p-2 ${editingDelivery ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                            {editingDelivery ? <Edit className="h-5 w-5 text-yellow-600" /> : <Package className="h-5 w-5 text-blue-600" />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {editingDelivery ? 'Edit Delivery' : 'New Delivery'}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                {editingDelivery ? 'Update delivery details' : 'Create a new delivery'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDeliveryModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={editingDelivery ? handleUpdateDelivery : handleCreateDelivery}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Link to Order</label>
                                            <select
                                                value={newDelivery.order_id}
                                                onChange={(e) => {
                                                    const orderId = e.target.value;
                                                    const order = orders.find(o => o.id === parseInt(orderId));
                                                    if (order) {
                                                        setNewDelivery({
                                                            ...newDelivery,
                                                            order_id: orderId,
                                                            customer_name: order.customer_name || '',
                                                            customer_phone: order.customer_phone || '',
                                                            customer_address: order.delivery_address || order.customer_address || '',
                                                            order_date: order.order_date || ''
                                                        });
                                                    } else {
                                                        setNewDelivery({...newDelivery, order_id: orderId});
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Order (Optional)</option>
                                                {orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').map(o => (
                                                    <option key={o.id} value={o.id}>
                                                        #{o.id} - {o.customer_name} (R{parseNumber(o.total_amount).toFixed(2)})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-400 mt-1">Selecting an order will auto-fill customer details</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newDelivery.customer_name}
                                                onChange={(e) => setNewDelivery({...newDelivery, customer_name: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Customer name"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                                            <input
                                                type="text"
                                                value={newDelivery.customer_phone}
                                                onChange={(e) => setNewDelivery({...newDelivery, customer_phone: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Order Date</label>
                                            <input
                                                type="date"
                                                value={newDelivery.order_date}
                                                onChange={(e) => setNewDelivery({...newDelivery, order_date: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700">Customer Address</label>
                                        <textarea
                                            value={newDelivery.customer_address}
                                            onChange={(e) => setNewDelivery({...newDelivery, customer_address: e.target.value})}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            rows="2"
                                            placeholder="Delivery address"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Product *</label>
                                            <select
                                                required
                                                value={newDelivery.product_name}
                                                onChange={(e) => {
                                                    setNewDelivery({...newDelivery, product_name: e.target.value, product_color: ''});
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Product</option>
                                                {productOptions.map(p => (
                                                    <option key={p.name} value={p.name}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Color</label>
                                            <select
                                                value={newDelivery.product_color}
                                                onChange={(e) => setNewDelivery({...newDelivery, product_color: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                disabled={!newDelivery.product_name}
                                            >
                                                <option value="">Select Color</option>
                                                {newDelivery.product_name && productOptions
                                                    .find(p => p.name === newDelivery.product_name)
                                                    ?.colors.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={newDelivery.quantity}
                                                onChange={(e) => {
                                                    const qty = e.target.value;
                                                    const pallets = calculatePallets(qty, newDelivery.product_name);
                                                    setNewDelivery({...newDelivery, quantity: qty, pallets: pallets.toString()});
                                                }}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Number of units"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Pallets</label>
                                            <input
                                                type="number"
                                                disabled
                                                value={newDelivery.pallets}
                                                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
                                                placeholder="Auto-calculated"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">
                                                {newDelivery.product_name?.toLowerCase().includes('brick') || 
                                                 newDelivery.product_name?.toLowerCase().includes('paving') || 
                                                 newDelivery.product_name?.toLowerCase().includes('block') 
                                                    ? 'Small units: 500/pallet | Large units: 50/pallet' 
                                                    : 'Units per pallet may vary'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                                            <input
                                                type="date"
                                                value={newDelivery.delivery_date}
                                                onChange={(e) => setNewDelivery({...newDelivery, delivery_date: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select
                                                value={newDelivery.status}
                                                onChange={(e) => setNewDelivery({...newDelivery, status: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                {statusOptions.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                                        <textarea
                                            value={newDelivery.notes}
                                            onChange={(e) => setNewDelivery({...newDelivery, notes: e.target.value})}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            rows="2"
                                            placeholder="Additional notes"
                                        />
                                    </div>

                                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                                        >
                                            {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeliveryModal(false);
                                                setEditingDelivery(null);
                                            }}
                                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===================================================== */}
            {/* TRIP MODAL (Add) */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showTripModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Create New Delivery Trip</h2>
                                    <button onClick={() => setShowTripModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTrip}>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Delivery</label>
                                            <select
                                                required
                                                value={newTrip.delivery_id}
                                                onChange={(e) => setNewTrip({...newTrip, delivery_id: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Delivery</option>
                                                {deliveries.filter(d => d.status !== 'Delivered').map(d => (
                                                    <option key={d.id} value={d.id}>
                                                        #{d.id} - {d.customer_name} ({d.pallets} pallets)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Driver *</label>
                                            <select
                                                required
                                                value={newTrip.driver_id}
                                                onChange={(e) => setNewTrip({...newTrip, driver_id: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Driver</option>
                                                {drivers.filter(d => d.status === 'Active').map(d => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.name} {d.surname}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vehicle Registration *</label>
                                            <input
                                                type="text"
                                                required
                                                value={newTrip.vehicle_registration}
                                                onChange={(e) => setNewTrip({...newTrip, vehicle_registration: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="e.g., CK 123-45"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Vehicle Type *</label>
                                            <select
                                                required
                                                value={newTrip.vehicle_type}
                                                onChange={(e) => setNewTrip({...newTrip, vehicle_type: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select Type</option>
                                                <option value="Flatbed">Flatbed</option>
                                                <option value="Tipper">Tipper</option>
                                                <option value="Truck">Truck</option>
                                                <option value="Van">Van</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Trip Date *</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={newTrip.trip_date}
                                                    onChange={(e) => setNewTrip({...newTrip, trip_date: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Departure Time *</label>
                                                <input
                                                    type="time"
                                                    required
                                                    value={newTrip.departure_time}
                                                    onChange={(e) => setNewTrip({...newTrip, departure_time: e.target.value})}
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                                            <textarea
                                                value={newTrip.delivery_notes}
                                                onChange={(e) => setNewTrip({...newTrip, delivery_notes: e.target.value})}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                rows="2"
                                                placeholder="Special instructions"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                            Create Trip
                                        </button>
                                        <button type="button" onClick={() => setShowTripModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===================================================== */}
            {/* DRIVER MODAL (Add/Edit) */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showDriverModal && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">{editingDriver ? 'Edit Driver' : 'Add Driver'}</h2>
                                    <button onClick={() => setShowDriverModal(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={editingDriver ? handleUpdateDriver : handleCreateDriver}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">First Name *</label>
                                            <input type="text" required value={newDriver.name} onChange={(e) => setNewDriver({...newDriver, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="First name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Surname *</label>
                                            <input type="text" required value={newDriver.surname} onChange={(e) => setNewDriver({...newDriver, surname: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Surname" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                                        <input type="tel" value={newDriver.phone} onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Phone number" />
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <input type="email" value={newDriver.email} onChange={(e) => setNewDriver({...newDriver, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Email address" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">License Number</label>
                                            <input type="text" value={newDriver.license_number} onChange={(e) => setNewDriver({...newDriver, license_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="License #" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">License Expiry</label>
                                            <input type="date" value={newDriver.license_expiry} onChange={(e) => setNewDriver({...newDriver, license_expiry: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                                        <input type="text" value={newDriver.employee_id} onChange={(e) => setNewDriver({...newDriver, employee_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Employee ID" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Status</label>
                                            <select value={newDriver.status} onChange={(e) => setNewDriver({...newDriver, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                                <option value="Active">Active</option>
                                                <option value="On Leave">On Leave</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                                            <input type="date" value={newDriver.hire_date} onChange={(e) => setNewDriver({...newDriver, hire_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                            {editingDriver ? 'Update Driver' : 'Add Driver'}
                                        </button>
                                        <button type="button" onClick={() => setShowDriverModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===================================================== */}
            {/* DELIVERY DETAIL MODAL */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showDetailModal && selectedDelivery && (
                    <motion.div 
                        className="fixed inset-0 z-50 overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailModal(false)} />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-blue-500" />
                                            <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedDelivery.status)}`}>
                                                {selectedDelivery.status}
                                            </span>
                                        </div>
                                        <button onClick={() => setShowDetailModal(false)} className="rounded-md bg-white text-gray-400 hover:text-gray-500">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Customer</p>
                                                <p className="font-medium">{selectedDelivery.customer_name}</p>
                                                <p className="text-sm text-gray-500">{selectedDelivery.customer_phone}</p>
                                                <p className="text-sm text-gray-400">{selectedDelivery.customer_address}</p>
                                            </div>
                                            {selectedDelivery.order && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">Linked Order</p>
                                                    <p className="font-medium text-blue-600">#{selectedDelivery.order.id} - {selectedDelivery.order.customer_name}</p>
                                                    <p className="text-sm text-gray-400">Total: {formatCurrency(selectedDelivery.order.total_amount)}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-gray-500">Product</p>
                                                <p className="font-medium">{selectedDelivery.product_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Color</p>
                                                {selectedDelivery.product_color && (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: selectedDelivery.product_color.toLowerCase() }} />
                                                        <span className="font-medium">{selectedDelivery.product_color}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Quantity</p>
                                                <p className="font-medium">{selectedDelivery.quantity?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Pallets</p>
                                                <p className="font-medium text-purple-600">{selectedDelivery.pallets || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Order Date</p>
                                                <p className="font-medium">{selectedDelivery.order_date ? new Date(selectedDelivery.order_date).toLocaleDateString() : '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Delivery Date</p>
                                                <p className="font-medium">{selectedDelivery.delivery_date ? new Date(selectedDelivery.delivery_date).toLocaleDateString() : '-'}</p>
                                            </div>
                                            {selectedDelivery.notes && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">Notes</p>
                                                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedDelivery.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                                        <button onClick={() => {
                                            setShowDetailModal(false);
                                            handleEditDelivery(selectedDelivery);
                                        }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition flex items-center justify-center gap-2">
                                            <Edit size={16} /> Edit Delivery
                                        </button>
                                        <button onClick={() => setShowDetailModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}