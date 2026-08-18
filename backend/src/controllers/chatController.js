const ChatModel = require('../models/chatModel');

class ChatController {
    // Get all conversations for the current user
    static async getConversations(req, res) {
        try {
            const userId = req.user.id;
            const conversations = await ChatModel.getUserConversations(userId);
            res.json(conversations);
        } catch (error) {
            console.error('Get conversations error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get messages for a conversation
    static async getMessages(req, res) {
        try {
            const userId = req.user.id;
            const { conversationId } = req.params;
            const { limit = 50, offset = 0 } = req.query;

            const messages = await ChatModel.getConversationMessages(
                conversationId, 
                userId, 
                parseInt(limit), 
                parseInt(offset)
            );
            res.json(messages);
        } catch (error) {
            console.error('Get messages error:', error);
            if (error.message === 'Conversation not found or access denied') {
                res.status(403).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    // Send a message
    static async sendMessage(req, res) {
        try {
            const { conversationId, message } = req.body;
            const senderId = req.user.id;

            if (!message || message.trim() === '') {
                return res.status(400).json({ error: 'Message cannot be empty' });
            }

            const sentMessage = await ChatModel.sendMessage(conversationId, senderId, message.trim());
            res.status(201).json(sentMessage);
        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Start a new conversation
    static async startConversation(req, res) {
        try {
            const { userId: otherUserId } = req.body;
            const currentUserId = req.user.id;

            if (currentUserId === otherUserId) {
                return res.status(400).json({ error: 'Cannot start conversation with yourself' });
            }

            const conversation = await ChatModel.getOrCreateConversation(currentUserId, otherUserId);
            
            // Get the other user's info
            const userResult = await pool.query(
                'SELECT id, username, full_name, email, status FROM users WHERE id = $1',
                [otherUserId]
            );

            res.status(201).json({
                conversation,
                other_user: userResult.rows[0]
            });
        } catch (error) {
            console.error('Start conversation error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Mark messages as read
    static async markAsRead(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            const result = await ChatModel.markMessagesAsRead(conversationId, userId);
            res.json({ message: 'Messages marked as read', count: result.length });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get unread count
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            const count = await ChatModel.getUnreadCount(userId);
            res.json({ unreadCount: count });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get unread notifications
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const notifications = await ChatModel.getUnreadNotifications(userId);
            res.json(notifications);
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Get online users
    static async getOnlineUsers(req, res) {
        try {
            const onlineUsers = await ChatModel.getOnlineUsers();
            res.json(onlineUsers);
        } catch (error) {
            console.error('Get online users error:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ChatController;