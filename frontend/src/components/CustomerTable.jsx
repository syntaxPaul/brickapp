//frontend/src/components/CustomerTable.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ChevronUp, ChevronDown, MoreVertical,
    Eye, Edit, Trash2, UserPlus, Check, X,
    Mail, Phone, MapPin, Building2, Clock,
    UserCheck, UserX, Star, Plus
} from 'lucide-react';
import { formatCurrency } from '../utils/parsers';

// Helper function to get initials
const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper function to get random avatar color
const getAvatarColor = (name) => {
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
        'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
        'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
};

// Helper function to get status badge
const getStatusBadge = (status) => {
    const statusMap = {
        'Active': { icon: <UserCheck size={12} />, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        'Inactive': { icon: <UserX size={12} />, bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
        'Suspended': { icon: <X size={12} />, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        'VIP': { icon: <Star size={12} />, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
    };
    return statusMap[status] || statusMap['Active'];
};

// Helper function to get priority badge
const getPriorityBadge = (priority) => {
    const priorityMap = {
        'Urgent': 'bg-red-50 text-red-700 border-red-200',
        'High': 'bg-orange-50 text-orange-700 border-orange-200',
        'Normal': 'bg-blue-50 text-blue-700 border-blue-200',
        'Low': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return priorityMap[priority] || priorityMap['Normal'];
};

// Pagination component
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
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">{totalPages * 10}</span> customers
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

export default function CustomerTable({ 
    customers = [],
    onViewOrders,
    onCreateOrder,
    onEdit,
    onDelete,
    onAddCustomer
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({
        column: 'name',
        direction: 'ascending'
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [showActions, setShowActions] = useState(null);
    const itemsPerPage = 10;

    // Filter and sort customers
    const sortedAndFilteredCustomers = useMemo(() => {
        // Filter
        let filtered = customers.filter(customer => {
            const search = searchQuery.toLowerCase();
            return (
                customer.name?.toLowerCase().includes(search) ||
                customer.company?.toLowerCase().includes(search) ||
                customer.email?.toLowerCase().includes(search) ||
                customer.phone?.includes(search)
            );
        });

        // Sort
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

    // Paginate
    const totalPages = Math.ceil(sortedAndFilteredCustomers.length / itemsPerPage);
    const paginatedCustomers = sortedAndFilteredCustomers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle sort
    const handleSort = (column) => {
        setSortDescriptor(prev => ({
            column,
            direction: prev.column === column && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedCustomers.length === paginatedCustomers.length) {
            setSelectedCustomers([]);
        } else {
            setSelectedCustomers(paginatedCustomers.map(c => c.id));
        }
    };

    // Handle select one
    const handleSelectOne = (id) => {
        setSelectedCustomers(prev =>
            prev.includes(id)
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    };

    // Get sort icon
    const getSortIcon = (column) => {
        if (sortDescriptor.column !== column) {
            return <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition" />;
        }
        return sortDescriptor.direction === 'ascending' 
            ? <ChevronUp size={14} />
            : <ChevronDown size={14} />;
    };

    // Calculate stats
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Table Header with Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedCustomers.length > 0 && (
                            <button
                                onClick={() => {
                                    // Bulk action - delete selected
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
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <UserPlus size={16} /> Add Customer
                        </button>
                    </div>
                </div>

                {/* Table */}
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
                                paginatedCustomers.map((customer, index) => {
                                    const statusBadge = getStatusBadge(customer.status);
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

                {/* Pagination */}
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
}