const { pool } = require('../config/database');

class ChatModel {
    // Get or create a conversation between two users
    static async getOrCreateConversation(user1Id, user2Id) {
        // Check if conversation exists
        let result = await pool.query(`
            SELECT * FROM chat_conversations 
            WHERE (participant1_id = $1 AND participant2_id = $2)
               OR (participant1_id = $2 AND participant2_id = $1)
        `, [user1Id, user2Id]);

        if (result.rows.length > 0) {
            return result.rows[0];
        }

        // Create new conversation
        result = await pool.query(`
            INSERT INTO chat_conversations (participant1_id, participant2_id)
            VALUES ($1, $2)
            RETURNING *
        `, [user1Id, user2Id]);

        return result.rows[0];
    }

    // Get all conversations for a user with last message
    static async getUserConversations(userId) {
        const result = await pool.query(`
            SELECT 
                c.id,
                c.participant1_id,
                c.participant2_id,
                c.last_message_at,
                u.id as other_user_id,
                u.username as other_username,
                u.full_name as other_full_name,
                u.email as other_email,
                u.status as other_status,
                (
                    SELECT json_build_object(
                        'id', m.id,
                        'message', m.message,
                        'sender_id', m.sender_id,
                        'created_at', m.created_at,
                        'is_read', m.is_read
                    )
                    FROM chat_messages m
                    WHERE m.conversation_id = c.id
                    ORDER BY m.created_at DESC
                    LIMIT 1
                ) as last_message,
                (
                    SELECT COUNT(*) 
                    FROM chat_messages m 
                    WHERE m.conversation_id = c.id 
                    AND m.sender_id != $1 
                    AND m.is_read = false
                ) as unread_count
            FROM chat_conversations c
            JOIN users u ON (u.id = c.participant1_id OR u.id = c.participant2_id)
            WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
            AND u.id != $1
            ORDER BY c.last_message_at DESC
        `, [userId]);

        return result.rows;
    }

    // Get messages for a conversation with pagination
    static async getConversationMessages(conversationId, userId, limit = 50, offset = 0) {
        // Verify user is in conversation
        const convCheck = await pool.query(`
            SELECT * FROM chat_conversations 
            WHERE id = $1 AND ($2 = participant1_id OR $2 = participant2_id)
        `, [conversationId, userId]);

        if (convCheck.rows.length === 0) {
            throw new Error('Conversation not found or access denied');
        }

        const result = await pool.query(`
            SELECT 
                m.id,
                m.message,
                m.sender_id,
                m.is_read,
                m.read_at,
                m.created_at,
                u.username as sender_username,
                u.full_name as sender_full_name
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
        `, [conversationId, limit, offset]);

        return result.rows.reverse();
    }

    // Send a message
    static async sendMessage(conversationId, senderId, message) {
        const result = await pool.query(`
            INSERT INTO chat_messages (conversation_id, sender_id, message)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [conversationId, senderId, message]);

        // Update conversation last_message_at
        await pool.query(`
            UPDATE chat_conversations 
            SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [conversationId]);

        // Get the full message with sender info
        const messageResult = await pool.query(`
            SELECT 
                m.*,
                u.username as sender_username,
                u.full_name as sender_full_name
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = $1
        `, [result.rows[0].id]);

        // Create notification for the other participant
        const conv = await pool.query(`
            SELECT participant1_id, participant2_id FROM chat_conversations WHERE id = $1
        `, [conversationId]);

        const otherUserId = conv.rows[0].participant1_id === senderId 
            ? conv.rows[0].participant2_id 
            : conv.rows[0].participant1_id;

        await pool.query(`
            INSERT INTO chat_notifications (user_id, from_user_id, message_id, conversation_id)
            VALUES ($1, $2, $3, $4)
        `, [otherUserId, senderId, result.rows[0].id, conversationId]);

        return messageResult.rows[0];
    }

    // Mark messages as read
    static async markMessagesAsRead(conversationId, userId) {
        const result = await pool.query(`
            UPDATE chat_messages 
            SET is_read = true, read_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1 
            AND sender_id != $2
            AND is_read = false
            RETURNING id
        `, [conversationId, userId]);

        // Mark notifications as read
        await pool.query(`
            UPDATE chat_notifications 
            SET is_read = true
            WHERE conversation_id = $1 AND user_id = $2
        `, [conversationId, userId]);

        return result.rows;
    }

    // Get unread message count for a user
    static async getUnreadCount(userId) {
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE (c.participant1_id = $1 OR c.participant2_id = $1)
            AND m.sender_id != $1
            AND m.is_read = false
        `, [userId]);

        return parseInt(result.rows[0].count);
    }

    // Get unread notifications for a user
    static async getUnreadNotifications(userId) {
        const result = await pool.query(`
            SELECT 
                n.id,
                n.from_user_id,
                n.message_id,
                n.conversation_id,
                n.created_at,
                u.username as from_username,
                u.full_name as from_full_name,
                m.message as message_preview
            FROM chat_notifications n
            JOIN users u ON n.from_user_id = u.id
            JOIN chat_messages m ON n.message_id = m.id
            WHERE n.user_id = $1 AND n.is_read = false
            ORDER BY n.created_at DESC
        `, [userId]);

        return result.rows;
    }

    // Mark notification as read
    static async markNotificationRead(notificationId, userId) {
        const result = await pool.query(`
            UPDATE chat_notifications 
            SET is_read = true
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `, [notificationId, userId]);
        return result.rows[0];
    }

    // Get online users
    static async getOnlineUsers() {
        const result = await pool.query(`
            SELECT 
                ou.user_id,
                u.username,
                u.full_name,
                u.email,
                u.status as user_status,
                ou.last_activity
            FROM chat_online_users ou
            JOIN users u ON ou.user_id = u.id
            WHERE ou.last_activity > NOW() - INTERVAL '5 minutes'
        `);
        return result.rows;
    }

    // Update user online status
    static async updateOnlineStatus(userId, socketId) {
        await pool.query(`
            INSERT INTO chat_online_users (user_id, socket_id, last_activity)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) 
            DO UPDATE SET socket_id = $2, last_activity = CURRENT_TIMESTAMP
        `, [userId, socketId]);
    }

    // Remove user from online
    static async removeOnlineStatus(userId) {
        await pool.query('DELETE FROM chat_online_users WHERE user_id = $1', [userId]);
    }
}

module.exports = ChatModel;