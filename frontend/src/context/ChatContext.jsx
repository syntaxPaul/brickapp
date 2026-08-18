//frontend/src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

const API_URL = 'http://localhost:5010/api';

export const ChatProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem('token');

    // Toggle chat widget
    const toggleChatWidget = () => {
        setIsChatOpen(!isChatOpen);
        console.log('💬 Toggle chat:', !isChatOpen);
    };

    // Initialize Socket.io connection
    useEffect(() => {
        if (!token) {
            console.log('🔗 No token, skipping socket connection');
            return;
        }

        console.log('🔗 Initializing socket connection...');
        
        const newSocket = io('http://localhost:5010', {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
            console.log('🔗 Socket connected');
            setIsConnected(true);
            fetchConversations();
            fetchUnreadCount();
        });

        newSocket.on('disconnect', () => {
            console.log('🔗 Socket disconnected');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
            setIsConnected(false);
        });

        // New message received
        newSocket.on('new_message', (message) => {
            console.log('📩 New message received:', message);
            handleNewMessage(message);
        });

        // Message sent confirmation
        newSocket.on('message_sent', (message) => {
            console.log('✅ Message sent:', message);
            setMessages(prev => {
                const exists = prev.some(m => m.id === message.id);
                if (exists) return prev;
                return [...prev, message];
            });
            scrollToBottom();
        });

        // New message notification
        newSocket.on('new_message_notification', (notification) => {
            console.log('🔔 New message notification:', notification);
            toast.success(`💬 New message from ${notification.from.full_name}`, {
                duration: 5000,
                icon: '💬',
                onClick: () => {
                    // Open chat and navigate to conversation
                    setIsChatOpen(true);
                    openConversation(notification.conversationId);
                }
            });
            fetchConversations();
            fetchUnreadCount();
            setNotifications(prev => [notification, ...prev]);
        });

        // Online users update
        newSocket.on('online_users', (users) => {
            console.log('👥 Online users updated:', users.length);
            setOnlineUsers(users);
        });

        // User typing indicator
        newSocket.on('user_typing', (data) => {
            setTypingUsers(prev => ({
                ...prev,
                [data.userId]: data.isTyping
            }));
            setTimeout(() => {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.userId]: false
                }));
            }, 3000);
        });

        // Messages read
        newSocket.on('messages_read', (data) => {
            console.log('📖 Messages read:', data);
            if (currentConversation?.id === data.conversationId) {
                setMessages(prev => prev.map(m => ({
                    ...m,
                    is_read: m.sender_id !== data.userId ? true : m.is_read
                })));
            }
            fetchConversations();
            fetchUnreadCount();
        });

        setSocket(newSocket);

        return () => {
            console.log('🔌 Closing socket connection');
            newSocket.close();
        };
    }, [token]);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${API_URL}/chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
        } catch (error) {
            console.error('Fetch conversations error:', error);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_URL}/chat/unread/count`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Fetch unread count error:', error);
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/chat/conversations/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
            
            // Mark messages as read
            await axios.put(`${API_URL}/chat/conversations/${conversationId}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Notify via socket
            if (socket && isConnected) {
                socket.emit('mark_read', { conversationId });
            }
            
            fetchConversations();
            fetchUnreadCount();
            scrollToBottom();
        } catch (error) {
            console.error('Fetch messages error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Open a conversation
    const openConversation = async (conversationId) => {
        const conv = conversations.find(c => c.id === parseInt(conversationId));
        setCurrentConversation(conv);
        await fetchMessages(conversationId);
        // Open chat widget if closed
        if (!isChatOpen) {
            setIsChatOpen(true);
        }
    };

    // Handle new message
    const handleNewMessage = (message) => {
        if (currentConversation && message.conversation_id === currentConversation.id) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
        }
        fetchConversations();
        fetchUnreadCount();
    };

    // Send a message
    const sendMessage = (message) => {
        if (!socket || !isConnected) {
            toast.error('Not connected to chat server');
            return;
        }
        if (!currentConversation) {
            toast.error('No conversation selected');
            return;
        }
        if (!message.trim()) {
            return;
        }

        console.log('📤 Sending message:', message);
        socket.emit('send_message', {
            conversationId: currentConversation.id,
            message: message.trim(),
            recipientId: currentConversation.other_user_id
        });
    };

    // Send typing indicator
    const sendTyping = (isTyping) => {
        if (!socket || !isConnected || !currentConversation) return;
        
        socket.emit('typing', {
            conversationId: currentConversation.id,
            isTyping
        });
    };

    // Start a new conversation
    const startConversation = async (userId) => {
        try {
            const res = await axios.post(`${API_URL}/chat/conversations`, 
                { userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Conversation started!');
            await fetchConversations();
            openConversation(res.data.conversation.id);
            return res.data;
        } catch (error) {
            console.error('Start conversation error:', error);
            toast.error('Failed to start conversation');
            return null;
        }
    };

    // Get other user in conversation
    const getOtherUser = (conversation) => {
        if (!conversation) return null;
        return {
            id: conversation.other_user_id,
            username: conversation.other_username,
            full_name: conversation.other_full_name,
            email: conversation.other_email
        };
    };

    // Check if user is online
    const isUserOnline = (userId) => {
        return onlineUsers.some(u => u.user_id === userId);
    };

    // Get typing status for user
    const isUserTyping = (userId) => {
        return typingUsers[userId] || false;
    };

    // Close conversation
    const closeConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
    };

    return (
        <ChatContext.Provider value={{
            socket,
            isConnected,
            conversations,
            currentConversation,
            messages,
            onlineUsers,
            unreadCount,
            notifications,
            loading,
            isChatOpen,
            toggleChatWidget,
            fetchConversations,
            fetchMessages,
            openConversation,
            closeConversation,
            sendMessage,
            sendTyping,
            startConversation,
            getOtherUser,
            isUserOnline,
            isUserTyping,
            messagesEndRef,
            setCurrentConversation,
            scrollToBottom,
            setIsChatOpen
        }}>
            {children}
        </ChatContext.Provider>
    );
};