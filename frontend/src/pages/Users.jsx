//frontend/src/pages/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users as UsersIcon, Plus, Edit, Trash2, UserCheck, UserX, Loader2,
    Search, Filter, RefreshCw, Shield, Mail, Phone, Building2,
    Key, User, Award, Crown, Medal, Star, CheckCircle,
    XCircle, AlertCircle, ChevronDown, ChevronUp, Eye,
    EyeOff, Clock, Calendar, FileText, Download, Printer,
    Settings, UserPlus, UserMinus, Activity, Zap, Target,
    Truck, DollarSign, X
} from 'lucide-react';
import toast from 'react-hot-toast';

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
// USER METRICS COMPONENT
// =====================================================
const UserMetrics = ({ users }) => {
    if (!users || users.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No users found</p>
                <p className="text-xs">Add a user to get started</p>
            </div>
        );
    }

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const inactiveUsers = users.filter(u => u.status === 'Inactive').length;
    const adminUsers = users.filter(u => u.roles?.some(r => r.role_name === 'Admin')).length;

    const metrics = [
        {
            label: 'Total Users',
            value: totalUsers,
            icon: <UsersIcon className="h-5 w-5" />,
            color: 'blue',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Active Users',
            value: activeUsers,
            icon: <UserCheck className="h-5 w-5" />,
            color: 'green',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            label: 'Inactive Users',
            value: inactiveUsers,
            icon: <UserX className="h-5 w-5" />,
            color: 'red',
            bgColor: 'bg-red-100',
            iconColor: 'text-red-600'
        },
        {
            label: 'Administrators',
            value: adminUsers,
            icon: <Shield className="h-5 w-5" />,
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
// MAIN USERS COMPONENT
// =====================================================
export default function Users() {
    // =====================================================
    // STATE
    // =====================================================
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'asc' });
    const [showPassword, setShowPassword] = useState(false);
    const [tableRefreshKey, setTableRefreshKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        full_name: '',
        phone: '',
        branches: [],
        roles: []
    });

    // Role options
    const roleOptions = [
        { value: 'Admin', label: 'Administrator', icon: <Crown className="h-4 w-4" />, color: 'purple' },
        { value: 'Manager', label: 'Manager', icon: <Award className="h-4 w-4" />, color: 'blue' },
        { value: 'POS', label: 'POS User', icon: <User className="h-4 w-4" />, color: 'green' },
        { value: 'Production', label: 'Production Staff', icon: <Activity className="h-4 w-4" />, color: 'orange' },
        { value: 'Delivery', label: 'Delivery Staff', icon: <Truck className="h-4 w-4" />, color: 'yellow' },
        { value: 'Finance', label: 'Finance Staff', icon: <DollarSign className="h-4 w-4" />, color: 'red' },
        { value: 'Viewer', label: 'Viewer (Read Only)', icon: <Eye className="h-4 w-4" />, color: 'gray' }
    ];

    // =====================================================
    // EFFECTS
    // =====================================================
    useEffect(() => {
        fetchData();
    }, []);

    // =====================================================
    // API CALLS
    // =====================================================
    const fetchData = async () => {
        try {
            const [usersRes, branchesRes] = await Promise.all([
                axios.get('/api/users'),
                axios.get('/api/branches')
            ]);
            setUsers(usersRes.data);
            setBranches(branchesRes.data);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        setTableRefreshKey(prev => prev + 1);
        fetchData();
    };

    // =====================================================
    // CRUD OPERATIONS
    // =====================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingUser) {
                // Update existing user
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await axios.put(`/api/users/${editingUser.id}`, updateData);
                toast.success('User updated successfully');
            } else {
                // Create new user
                await axios.post('/api/users', formData);
                toast.success('User created successfully');
            }
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            email: user.email || '',
            full_name: user.full_name || '',
            phone: user.phone || '',
            branches: user.branches || [],
            roles: user.roles?.map(r => r.role_name) || []
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!deletingUser) return;
        try {
            await axios.delete(`/api/users/${deletingUser.id}`);
            toast.success('User deleted successfully');
            setShowDeleteModal(false);
            setDeletingUser(null);
            refreshData();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            email: '',
            full_name: '',
            phone: '',
            branches: [],
            roles: []
        });
        setEditingUser(null);
        setShowPassword(false);
    };

    const toggleBranchPrimary = (branchId) => {
        setFormData({
            ...formData,
            branches: formData.branches.map(b => ({
                ...b,
                is_primary: b.branch_id === branchId
            }))
        });
    };

    const toggleBranch = (branchId) => {
        const existing = formData.branches.find(b => b.branch_id === branchId);
        if (existing) {
            setFormData({
                ...formData,
                branches: formData.branches.filter(b => b.branch_id !== branchId)
            });
        } else {
            const isFirst = formData.branches.length === 0;
            setFormData({
                ...formData,
                branches: [...formData.branches, { branch_id: branchId, is_primary: isFirst }]
            });
        }
    };

    const toggleRole = (role) => {
        setFormData({
            ...formData,
            roles: formData.roles.includes(role)
                ? formData.roles.filter(r => r !== role)
                : [...formData.roles, role]
        });
    };

    // =====================================================
    // HELPERS
    // =====================================================
    const getStatusBadge = (status) => {
        if (status === 'Active') {
            return { 
                bg: 'bg-green-100', 
                text: 'text-green-700', 
                icon: <CheckCircle className="h-3 w-3" />,
                label: 'Active'
            };
        }
        return { 
            bg: 'bg-gray-100', 
            text: 'text-gray-700', 
            icon: <XCircle className="h-3 w-3" />,
            label: 'Inactive'
        };
    };

    const getRoleBadge = (role) => {
        const colors = {
            'Admin': 'bg-purple-100 text-purple-700',
            'Manager': 'bg-blue-100 text-blue-700',
            'POS': 'bg-green-100 text-green-700',
            'Production': 'bg-orange-100 text-orange-700',
            'Delivery': 'bg-yellow-100 text-yellow-700',
            'Finance': 'bg-red-100 text-red-700',
            'Viewer': 'bg-gray-100 text-gray-700'
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

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

    const filteredUsers = users.filter(user => {
        const search = searchQuery.toLowerCase();
        const matchesSearch = user.full_name?.toLowerCase().includes(search) ||
                             user.username?.toLowerCase().includes(search) ||
                             user.email?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || '';
        const bVal = b[sortConfig.key] || '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    if (loading) {
        return (
            <div className="flex justify-center h-64 items-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

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
                        <UsersIcon className="h-7 w-7 mr-2 text-blue-500" />
                        User Management
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage system users, roles, and branch assignments
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
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </motion.button>
                </div>
            </motion.div>

            {/* User Metrics */}
            <UserMetrics users={users} />

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
                            placeholder="Search users..."
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
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr className="text-left text-gray-500">
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'full_name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        User
                                        {sortConfig.key === 'full_name' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium cursor-pointer" onClick={() => setSortConfig({ key: 'username', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                    <div className="flex items-center gap-1">
                                        Username
                                        {sortConfig.key === 'username' && (
                                            sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 font-medium">Email</th>
                                <th className="py-3 px-4 font-medium">Branches</th>
                                <th className="py-3 px-4 font-medium">Roles</th>
                                <th className="py-3 px-4 font-medium text-center">Status</th>
                                <th className="py-3 px-4 font-medium text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-400">
                                        <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">No users found</p>
                                        <p className="text-xs">Add a new user to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => {
                                    const statusBadge = getStatusBadge(user.status);
                                    const avatarColor = getAvatarColor(user.full_name || user.username);
                                    const initials = getInitials(user.full_name || user.username);
                                    const userRoles = user.roles?.map(r => r.role_name) || [];

                                    return (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full ${avatarColor} text-white flex items-center justify-center font-medium text-sm flex-shrink-0`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.full_name || user.username}</p>
                                                        <p className="text-xs text-gray-400">{user.phone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="font-mono text-sm">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{user.email || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.branches?.map((b, i) => {
                                                        const branch = branches.find(br => br.id === b.branch_id);
                                                        return (
                                                            <span key={i} className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                                                <Building2 className="h-3 w-3" />
                                                                {branch?.code || b.branch_id}
                                                                {b.is_primary && <Star className="h-2.5 w-2.5 text-yellow-500 ml-0.5" />}
                                                            </span>
                                                        );
                                                    })}
                                                    {(!user.branches || user.branches.length === 0) && (
                                                        <span className="text-xs text-gray-400">No branches</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {userRoles.map((role, i) => (
                                                        <span key={i} className={`inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full ${getRoleBadge(role)}`}>
                                                            {role === 'Admin' && <Crown className="h-3 w-3" />}
                                                            {role === 'Manager' && <Award className="h-3 w-3" />}
                                                            {role === 'POS' && <User className="h-3 w-3" />}
                                                            {role === 'Production' && <Activity className="h-3 w-3" />}
                                                            {role === 'Delivery' && <Truck className="h-3 w-3" />}
                                                            {role === 'Finance' && <DollarSign className="h-3 w-3" />}
                                                            {role === 'Viewer' && <Eye className="h-3 w-3" />}
                                                            {role}
                                                        </span>
                                                    ))}
                                                    {userRoles.length === 0 && (
                                                        <span className="text-xs text-gray-400">No roles</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                                                    {statusBadge.icon}
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setDeletingUser(user);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* ===================================================== */}
            {/* USER MODAL (Add/Edit) */}
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
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
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
                                className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
                            >
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`rounded-lg p-2 ${editingUser ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                                                {editingUser ? <Edit className="h-5 w-5 text-yellow-600" /> : <UserPlus className="h-5 w-5 text-blue-600" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {editingUser ? 'Edit User' : 'Add New User'}
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {editingUser ? 'Update user details and permissions' : 'Create a new system user'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowModal(false);
                                                resetForm();
                                            }}
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto pr-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                                <div className="relative mt-1">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="John Doe"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Username *</label>
                                                <div className="relative mt-1">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.username}
                                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="johndoe"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                                <div className="relative mt-1">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="john@example.com"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                                <div className="relative mt-1">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        placeholder="+27 82 555 1234"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                                            </label>
                                            <div className="relative mt-1">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required={!editingUser}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                    className="w-full pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    placeholder={editingUser ? '••••••••' : 'Min 6 characters'}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {!editingUser && (
                                                <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
                                            )}
                                        </div>

                                        {/* Branch Assignment */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Building2 className="inline h-4 w-4 mr-1" />
                                                Branch Assignments
                                            </label>
                                            <div className="space-y-2">
                                                {branches.map((branch) => {
                                                    const isAssigned = formData.branches.some(b => b.branch_id === branch.id);
                                                    const isPrimary = formData.branches.find(b => b.branch_id === branch.id)?.is_primary;
                                                    return (
                                                        <div key={branch.id} className="flex items-center gap-3">
                                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAssigned}
                                                                    onChange={() => toggleBranch(branch.id)}
                                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                                />
                                                                {branch.name}
                                                                <span className="text-xs text-gray-400">({branch.code})</span>
                                                            </label>
                                                            {isAssigned && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleBranchPrimary(branch.id)}
                                                                    className={`text-xs px-2 py-0.5 rounded transition ${
                                                                        isPrimary
                                                                            ? 'bg-yellow-100 text-yellow-800'
                                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                    }`}
                                                                >
                                                                    {isPrimary ? <Star className="inline h-3 w-3 mr-0.5" /> : null}
                                                                    {isPrimary ? 'Primary' : 'Set Primary'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {branches.length === 0 && (
                                                <p className="text-sm text-gray-400">No branches available</p>
                                            )}
                                        </div>

                                        {/* Role Assignment */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Shield className="inline h-4 w-4 mr-1" />
                                                Roles & Permissions
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {roleOptions.map((role) => {
                                                    const isSelected = formData.roles.includes(role.value);
                                                    return (
                                                        <button
                                                            key={role.value}
                                                            type="button"
                                                            onClick={() => toggleRole(role.value)}
                                                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition ${
                                                                isSelected
                                                                    ? `border-${role.color}-500 bg-${role.color}-50 text-${role.color}-700`
                                                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <span className={isSelected ? `text-${role.color}-500` : 'text-gray-400'}>
                                                                {role.icon}
                                                            </span>
                                                            {role.label}
                                                            {isSelected && <CheckCircle className="h-3.5 w-3.5 ml-auto text-green-500" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        {editingUser ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        {editingUser ? <Edit className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                                        {editingUser ? 'Update User' : 'Create User'}
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    resetForm();
                                                }}
                                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
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
            {/* DELETE CONFIRMATION MODAL */}
            {/* ===================================================== */}
            <AnimatePresence>
                {showDeleteModal && deletingUser && (
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
                                    setShowDeleteModal(false);
                                    setDeletingUser(null);
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
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="rounded-lg bg-red-100 p-2">
                                            <AlertCircle className="h-6 w-6 text-red-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                                            <p className="text-sm text-gray-500">This action cannot be undone</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(deletingUser.full_name || deletingUser.username)} text-white flex items-center justify-center font-medium`}>
                                                {getInitials(deletingUser.full_name || deletingUser.username)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{deletingUser.full_name || deletingUser.username}</p>
                                                <p className="text-sm text-gray-500">{deletingUser.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-4">
                                        Are you sure you want to delete this user? This will permanently remove their account and all associated data.
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete User
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setDeletingUser(null);
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}