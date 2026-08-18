// backend/src/routes/chat.js
const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');

// Get all conversations
router.get('/conversations', authenticateToken, ChatController.getConversations);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, ChatController.getMessages);

// Send a message
router.post('/messages', authenticateToken, ChatController.sendMessage);

// Start a new conversation
router.post('/conversations', authenticateToken, ChatController.startConversation);

// Mark messages as read
router.put('/conversations/:conversationId/read', authenticateToken, ChatController.markAsRead);

// Get unread count
router.get('/unread/count', authenticateToken, ChatController.getUnreadCount);

// Get notifications
router.get('/notifications', authenticateToken, ChatController.getNotifications);

// Get online users
router.get('/online/users', authenticateToken, ChatController.getOnlineUsers);

module.exports = router;