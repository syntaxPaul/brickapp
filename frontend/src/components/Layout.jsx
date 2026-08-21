//frontend/src/components/Layout.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import BranchSelector from './BranchSelector';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Truck,
    Wallet,
    AlertTriangle,
    LogOut,
    User,
    Factory,
    Clipboard,
    Users,
    Building2,
    Menu,
    X,
    Search,
    Bell,
    MessageCircle,
    ChevronDown,
    Settings,
    HelpCircle,
    UserCircle,
    Shield,
    LogOut as LogOutIcon,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

function NavLink({ to, icon, label, badge, active, collapsed }) {
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                active 
                    ? 'bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-600/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? label : ''}
        >
            <span className="w-5 h-5 flex-shrink-0">{icon}</span>
            {!collapsed && <span className="text-sm font-medium nav-label">{label}</span>}
            {!collapsed && badge && (
                <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default function Layout() {
    const { user, logout, currentBranch } = useAuth();
    const chatContext = useChat();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const userMenuRef = useRef(null);
    const notificationsRef = useRef(null);

    // Get chat data with safe defaults
    const unreadCount = chatContext?.unreadCount || 0;
    const isConnected = chatContext?.isConnected || false;
    const toggleChatWidget = chatContext?.toggleChatWidget || (() => console.log('Chat toggle not available'));

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { path: '/products', icon: <Package size={18} />, label: 'Products' },
        { path: '/orders', icon: <ShoppingCart size={18} />, label: 'Orders' },
        { path: '/production', icon: <Factory size={18} />, label: 'Production' },
        { path: '/deliveries', icon: <Truck size={18} />, label: 'Deliveries' },
        { path: '/suppliers', icon: <Clipboard size={18} />, label: 'Suppliers' },
        { path: '/expenses', icon: <Wallet size={18} />, label: 'Expenses' },
        { path: '/wastage', icon: <AlertTriangle size={18} />, label: 'Wastage' },
        { path: '/users', icon: <Users size={18} />, label: 'Users' },
    ];

    // Sample notifications
    const notifications = [
        { id: 1, title: 'New Order #1234', message: 'Order placed by ABC Construction', time: '5 min ago', read: false, type: 'order' },
        { id: 2, title: 'Low Stock Alert', message: 'Standard Brick below threshold', time: '1 hour ago', read: false, type: 'stock' },
        { id: 3, title: 'Delivery Completed', message: 'Trip #567 delivered successfully', time: '3 hours ago', read: true, type: 'delivery' },
        { id: 4, title: 'Payment Received', message: 'R2,750.00 from XYZ Developers', time: '5 hours ago', read: true, type: 'payment' },
    ];

    const notificationCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type) => {
        switch(type) {
            case 'order': return <ShoppingCart size={16} className="text-blue-500" />;
            case 'stock': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'delivery': return <Truck size={16} className="text-green-500" />;
            case 'payment': return <Wallet size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-gray-500" />;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside 
                className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
            >
                {/* Logo */}
                <div className="logo">
                    <div className="flex items-center gap-2">
                        <Building2 size={28} className="text-blue-400 flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <span className="logo-text text-white font-bold text-lg">
                                Brick<span className="text-blue-400">App</span>
                            </span>
                        )}
                    </div>
                    {/* Collapse Toggle Button */}
                    <button
                        onClick={toggleSidebar}
                        className="collapse-btn"
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Branch Selector */}
                <div className="px-3 py-3 border-b border-white/5">
                    <BranchSelector collapsed={sidebarCollapsed} />
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            active={location.pathname === item.path || 
                                    (item.path !== '/' && location.pathname.startsWith(item.path))}
                            collapsed={sidebarCollapsed}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    <div className={`user-info ${sidebarCollapsed ? 'justify-center' : ''}`}>
                        <div className="user-avatar flex-shrink-0">
                            {getInitials(user?.full_name || user?.username)}
                        </div>
                        {!sidebarCollapsed && (
                            <div className="user-details min-w-0">
                                <div className="user-name truncate">{user?.full_name || user?.username}</div>
                                <div className="user-role text-xs">Administrator</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`logout-btn ${sidebarCollapsed ? 'justify-center' : ''}`}
                        title={sidebarCollapsed ? 'Logout' : ''}
                    >
                        <LogOut size={16} className="flex-shrink-0" />
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen overflow-y-auto">
                {/* Top Bar */}
                <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
                        >
                            <Menu size={20} className="text-gray-600" />
                        </button>

                        {/* Page Title */}
                        <div className="hidden sm:block">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Welcome back, {user?.full_name?.split(' ')[0] || user?.username}
                            </p>
                        </div>
                    </div>

                    {/* Center Section - Search Bar */}
                    <div className="flex-1 max-w-md mx-4 hidden md:block">
                        <div className={`relative transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search orders, products, customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300 hidden sm:block">
                                ⌘K
                            </kbd>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Date */}
                        <span className="text-sm text-gray-500 hidden lg:block">
                            {new Date().toLocaleDateString('en-ZA', { 
                                weekday: 'short', 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                            })}
                        </span>

                        {/* Search (Mobile) */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition md:hidden">
                            <Search size={20} className="text-gray-500" />
                        </button>

                        {/* Chat Button - Opens chat widget */}
                        <button 
                            onClick={toggleChatWidget}
                            className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                            title="Open Chat"
                        >
                            <MessageCircle size={20} className="text-gray-500" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                            {isConnected && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        {/* Notifications */}
                        <div className="relative" ref={notificationsRef}>
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="relative p-2 rounded-lg hover:bg-gray-100 transition"
                            >
                                <Bell size={20} className="text-gray-500" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                            Mark all read
                                        </button>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer ${
                                                    !notif.read ? 'bg-blue-50/50' : ''
                                                }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                                    <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                                        <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-sm flex items-center justify-center shadow-md">
                                    {getInitials(user?.full_name || user?.username)}
                                </div>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* User Dropdown */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                        <p className="text-sm font-semibold text-gray-800">{user?.full_name || user?.username}</p>
                                        <p className="text-xs text-gray-500">{user?.email || 'user@brickapp.com'}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 rounded-full">
                                            Administrator
                                        </span>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-1">
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                                            <UserCircle size={16} className="text-gray-400" />
                                            My Profile
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                                            <Settings size={16} className="text-gray-400" />
                                            Settings
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                                            <Shield size={16} className="text-gray-400" />
                                            Security
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                                            <HelpCircle size={16} className="text-gray-400" />
                                            Help & Support
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-gray-100"></div>

                                    {/* Logout */}
                                    <div className="py-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                                        >
                                            <LogOutIcon size={16} />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 sm:p-6">
                    <Outlet key={currentBranch} />
                </div>
            </main>

            {/* Debug Chat Status - Remove this after testing */}
            <div className="fixed bottom-4 left-4 z-50 text-xs bg-black/80 text-white px-3 py-1.5 rounded-full">
                Chat: {isConnected ? '🟢' : '🔴'} {unreadCount} unread
            </div>
        </div>
    );
}