// backend/src/services/socketService.js
const ChatModel = require('../models/chatModel');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

let io = null;

const initializeSocket = (server) => {
    try {
        // Try to require socket.io
        const { Server } = require('socket.io');
        
        io = new Server(server, {
            cors: {
                origin: 'http://localhost:3010',
                credentials: true,
                methods: ['GET', 'POST']
            }
        });

        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication required'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                const result = await pool.query('SELECT id, username, full_name FROM users WHERE id = $1', [decoded.id]);
                
                if (result.rows.length === 0) {
                    return next(new Error('User not found'));
                }

                socket.user = result.rows[0];
                socket.userId = decoded.id;
                next();
            } catch (error) {
                console.error('Socket auth error:', error);
                next(new Error('Invalid token'));
            }
        });

        io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.user.username} (${socket.userId})`);

            socket.join(`user_${socket.userId}`);

            ChatModel.updateOnlineStatus(socket.userId, socket.id);
            broadcastOnlineUsers();

            socket.on('send_message', async (data) => {
                try {
                    const { conversationId, message } = data;
                    
                    const sentMessage = await ChatModel.sendMessage(conversationId, socket.userId, message);
                    
                    const convResult = await pool.query(`
                        SELECT participant1_id, participant2_id FROM chat_conversations WHERE id = $1
                    `, [conversationId]);
                    
                    const conv = convResult.rows[0];
                    const recipient = conv.participant1_id === socket.userId ? conv.participant2_id : conv.participant1_id;

                    socket.emit('message_sent', sentMessage);

                    io.to(`user_${recipient}`).emit('new_message', {
                        ...sentMessage,
                        conversation_id: conversationId
                    });

                    io.to(`user_${recipient}`).emit('new_message_notification', {
                        from: {
                            id: socket.userId,
                            username: socket.user.username,
                            full_name: socket.user.full_name
                        },
                        message: message.substring(0, 100),
                        conversationId: conversationId,
                        messageId: sentMessage.id,
                        timestamp: new Date()
                    });

                } catch (error) {
                    console.error('Send message error:', error);
                    socket.emit('message_error', { error: error.message });
                }
            });

            socket.on('typing', async (data) => {
                const { conversationId, isTyping } = data;
                try {
                    const convResult = await pool.query(`
                        SELECT participant1_id, participant2_id FROM chat_conversations WHERE id = $1
                    `, [conversationId]);
                    
                    const conv = convResult.rows[0];
                    const recipient = conv.participant1_id === socket.userId ? conv.participant2_id : conv.participant1_id;
                    
                    io.to(`user_${recipient}`).emit('user_typing', {
                        userId: socket.userId,
                        username: socket.user.username,
                        conversationId,
                        isTyping
                    });
                } catch (error) {
                    console.error('Typing error:', error);
                }
            });

            socket.on('mark_read', async (data) => {
                try {
                    const { conversationId } = data;
                    await ChatModel.markMessagesAsRead(conversationId, socket.userId);
                    
                    const convResult = await pool.query(`
                        SELECT participant1_id, participant2_id FROM chat_conversations WHERE id = $1
                    `, [conversationId]);
                    
                    const conv = convResult.rows[0];
                    const otherUser = conv.participant1_id === socket.userId ? conv.participant2_id : conv.participant1_id;
                    
                    io.to(`user_${otherUser}`).emit('messages_read', {
                        conversationId,
                        userId: socket.userId
                    });
                } catch (error) {
                    console.error('Mark read error:', error);
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.user.username}`);
                ChatModel.removeOnlineStatus(socket.userId);
                broadcastOnlineUsers();
            });

            socket.on('reconnect', () => {
                console.log(`🔄 User reconnected: ${socket.user.username}`);
                ChatModel.updateOnlineStatus(socket.userId, socket.id);
                broadcastOnlineUsers();
            });
        });

        console.log('✅ Socket.io initialized successfully');
        return io;
    } catch (error) {
        console.error('❌ Failed to initialize Socket.io:', error.message);
        return null;
    }
};

const broadcastOnlineUsers = async () => {
    if (!io) return;
    try {
        const onlineUsers = await ChatModel.getOnlineUsers();
        io.emit('online_users', onlineUsers);
    } catch (error) {
        console.error('Broadcast online users error:', error);
    }
};

module.exports = { initializeSocket };