//frontend/src/components/Chat/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { 
    MessageCircle, X, Send, User, Users, Check, CheckCheck, 
    Phone, Video, MoreVertical, Search, XCircle, UserCheck,
    Clock, ChevronDown, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function ChatWidget() {
    const { user } = useAuth();
    const chatContext = useChat();
    
    console.log('💬 ChatWidget rendering...');
    console.log('💬 ChatContext:', chatContext);

    const {
        conversations = [],
        currentConversation,
        messages = [],
        onlineUsers = [],
        unreadCount = 0,
        isConnected = false,
        loading = false,
        isChatOpen = false,  // Use context state
        toggleChatWidget,    // Use context toggle
        openConversation,
        sendMessage,
        sendTyping,
        startConversation,
        getOtherUser,
        isUserOnline,
        isUserTyping,
        messagesEndRef,
        setCurrentConversation,
        closeConversation
    } = chatContext;

    const [messageInput, setMessageInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const inputRef = useRef(null);

    console.log('💬 ChatWidget state - isChatOpen:', isChatOpen, 'conversations:', conversations.length);

    // Load all users for new chat
    useEffect(() => {
        if (showNewChat) {
            fetchAllUsers();
        }
    }, [showNewChat]);

    const fetchAllUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllUsers(res.data.filter(u => u.id !== user.id));
        } catch (error) {
            console.error('Fetch users error:', error);
        }
    };

    // Handle typing
    const handleTyping = (value) => {
        setMessageInput(value);
        
        if (value.length > 0 && !isTyping) {
            setIsTyping(true);
            sendTyping(true);
        } else if (value.length === 0 && isTyping) {
            setIsTyping(false);
            sendTyping(false);
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                sendTyping(false);
            }
        }, 2000);
    };

    // Handle send message
    const handleSend = () => {
        if (messageInput.trim()) {
            sendMessage(messageInput.trim());
            setMessageInput('');
            setIsTyping(false);
            sendTyping(false);
        }
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Format time
    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    };

    // Filter conversations
    const filteredConversations = conversations.filter(conv => 
        conv.other_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.other_username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get online count
    const onlineCount = onlineUsers.filter(u => u.user_id !== user?.id).length;

    // Handle opening a conversation
    const handleOpenConversation = (conversationId) => {
        openConversation(conversationId);
    };

    // Handle closing conversation
    const handleCloseConversation = () => {
        if (closeConversation) {
            closeConversation();
        } else {
            setCurrentConversation(null);
        }
    };

    // If no chat context, show nothing
    if (!chatContext) {
        console.error('💬 ChatContext is undefined!');
        return null;
    }

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={toggleChatWidget}
                className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
            >
                <div className="relative">
                    {isChatOpen ? (
                        <X size={24} className="transition-transform rotate-0 group-hover:rotate-90" />
                    ) : (
                        <MessageCircle size={24} className="transition-transform group-hover:scale-110" />
                    )}
                    {!isChatOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 z-[100] w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <MessageCircle size={20} className="text-white" />
                                    </div>
                                    {isConnected && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-blue-600 rounded-full"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold">Messages</h3>
                                    <p className="text-white/70 text-xs">
                                        {isConnected ? `${onlineCount} online` : 'Connecting...'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setShowNewChat(true)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
                                    title="New Chat"
                                >
                                    <Plus size={18} />
                                </button>
                                <button 
                                    onClick={toggleChatWidget}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        {!currentConversation && (
                            <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search conversations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Conversation List */}
                        {!currentConversation && (
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                        <MessageCircle size={40} className="mb-2 opacity-20" />
                                        <p className="text-sm">No conversations yet</p>
                                        <p className="text-xs">Start a new chat with a team member</p>
                                    </div>
                                ) : (
                                    filteredConversations.map((conv) => {
                                        const otherUser = getOtherUser(conv);
                                        const isOnline = isUserOnline(conv.other_user_id);
                                        return (
                                            <button
                                                key={conv.id}
                                                onClick={() => handleOpenConversation(conv.id)}
                                                className="w-full px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-50 text-left"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                                        {otherUser?.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    {isOnline && (
                                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                        {otherUser?.full_name || otherUser?.username}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {conv.last_message?.message || 'No messages yet'}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 text-right">
                                                    {conv.last_message?.created_at && (
                                                        <p className="text-xs text-gray-400">
                                                            {formatTime(conv.last_message.created_at)}
                                                        </p>
                                                    )}
                                                    {conv.unread_count > 0 && (
                                                        <span className="mt-1 inline-block w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                            {conv.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* Chat View */}
                        {currentConversation && (
                            <>
                                {/* Chat Header */}
                                <div className="flex-shrink-0 px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <button
                                        onClick={handleCloseConversation}
                                        className="text-gray-500 hover:text-gray-700 transition p-1"
                                    >
                                        <ChevronDown size={20} />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                                {getOtherUser(currentConversation)?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            {isUserOnline(currentConversation.other_user_id) && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-800">
                                                {getOtherUser(currentConversation)?.full_name || getOtherUser(currentConversation)?.username}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {isUserTyping(currentConversation.other_user_id) ? (
                                                    <span className="text-blue-600 animate-pulse">typing...</span>
                                                ) : isUserOnline(currentConversation.other_user_id) ? (
                                                    'Online'
                                                ) : (
                                                    'Offline'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400">
                                            <Phone size={16} />
                                        </button>
                                        <button className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400">
                                            <Video size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <MessageCircle size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">No messages yet</p>
                                            <p className="text-xs">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isOwn = msg.sender_id === user?.id;
                                            const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;
                                            
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex items-end gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                                                >
                                                    {!isOwn && showAvatar && (
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
                                                            {getOtherUser(currentConversation)?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    {!isOwn && !showAvatar && <div className="w-7 flex-shrink-0"></div>}
                                                    
                                                    <div
                                                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                                            isOwn 
                                                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                                                : 'bg-white border border-gray-100 rounded-tl-sm shadow-sm'
                                                        }`}
                                                    >
                                                        <p className="break-words">{msg.message}</p>
                                                        <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                            {formatTime(msg.created_at)}
                                                            {isOwn && (
                                                                <span className="ml-1">
                                                                    {msg.is_read ? (
                                                                        <CheckCheck size={12} className="inline text-blue-200" />
                                                                    ) : (
                                                                        <Check size={12} className="inline text-blue-300" />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
                                    <div className="flex items-center gap-2">
                                        <textarea
                                            ref={inputRef}
                                            value={messageInput}
                                            onChange={(e) => handleTyping(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Type a message..."
                                            className="flex-1 resize-none px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition min-h-[44px] max-h-32"
                                            rows={1}
                                            style={{ height: '44px' }}
                                        />
                                        <button
                                            onClick={handleSend}
                                            disabled={!messageInput.trim()}
                                            className={`p-2.5 rounded-xl transition flex-shrink-0 ${
                                                messageInput.trim() 
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg' 
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}