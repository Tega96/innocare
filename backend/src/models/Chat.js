// backend/src/models/ChatMessage.js
const { query } = require('../config/database');

class ChatMessage {
  constructor() {
    this.tableName = 'chat_messages';
  }

  /**
   * Send message
   */
  async send(messageData) {
    const { sender_id, recipient_id, message, message_type, consent_for_records } = messageData;
    
    const result = await query(
      `INSERT INTO chat_messages 
       (id, sender_id, recipient_id, message, message_type, consent_for_records)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [sender_id, recipient_id, message, message_type || 'text', consent_for_records || false]
    );
    
    return result.rows[0];
  }

  /**
   * Get messages between two users
   */
  async getMessages(userId1, userId2, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const result = await query(
      `SELECT cm.*, 
              u_sender.email as sender_email,
              u_sender.role as sender_role,
              u_recipient.email as recipient_email,
              u_recipient.role as recipient_role
       FROM chat_messages cm
       JOIN users u_sender ON cm.sender_id = u_sender.id
       JOIN users u_recipient ON cm.recipient_id = u_recipient.id
       WHERE (cm.sender_id = $1 AND cm.recipient_id = $2)
          OR (cm.sender_id = $2 AND cm.recipient_id = $1)
       ORDER BY cm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId1, userId2, limit, offset]
    );
    
    return result.rows.reverse();
  }

  /**
   * Mark messages as read
   */
  async markAsRead(senderId, recipientId) {
    const result = await query(
      `UPDATE chat_messages 
       SET is_read = true, read_at = NOW()
       WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false
       RETURNING *`,
      [senderId, recipientId]
    );
    
    return result.rows;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE recipient_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get conversations for user
   */
  async getConversations(userId) {
    const result = await query(
      `WITH last_messages AS (
         SELECT DISTINCT ON (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id))
                sender_id, recipient_id, message, created_at, is_read
         FROM chat_messages
         WHERE sender_id = $1 OR recipient_id = $1
         ORDER BY LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC
       )
       SELECT lm.*,
              CASE 
                WHEN lm.sender_id = $1 THEN 'sent'
                ELSE 'received'
              END as direction,
              u.id as other_user_id,
              u.email as other_user_email,
              u.role as other_user_role,
              COALESCE(p.first_name, d.first_name) as other_first_name,
              COALESCE(p.last_name, d.last_name) as other_last_name,
              COUNT(CASE WHEN cm.recipient_id = $1 AND cm.is_read = false THEN 1 END) as unread_count
       FROM last_messages lm
       JOIN users u ON (u.id = lm.sender_id OR u.id = lm.recipient_id) AND u.id != $1
       LEFT JOIN patients p ON u.id = p.user_id
       LEFT JOIN doctors d ON u.id = d.user_id
       LEFT JOIN chat_messages cm ON (cm.sender_id = u.id AND cm.recipient_id = $1)
       GROUP BY lm.sender_id, lm.recipient_id, lm.message, lm.created_at, lm.is_read,
                u.id, u.email, u.role, p.first_name, p.last_name, d.first_name, d.last_name
       ORDER BY lm.created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  /**
   * Get conversation with user
   */
  async getConversation(userId, otherUserId) {
    const messages = await this.getMessages(userId, otherUserId);
    
    const otherUser = await query(
      `SELECT u.id, u.email, u.role,
              COALESCE(p.first_name, d.first_name) as first_name,
              COALESCE(p.last_name, d.last_name) as last_name
       FROM users u
       LEFT JOIN patients p ON u.id = p.user_id
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.id = $1`,
      [otherUserId]
    );
    
    return {
      messages,
      otherUser: otherUser.rows[0]
    };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(userId, otherUserId) {
    const result = await query(
      `DELETE FROM chat_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       RETURNING id`,
      [userId, otherUserId]
    );
    
    return result.rows;
  }

  /**
   * Get message count
   */
  async getMessageCount(userId1, userId2) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM chat_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)`,
      [userId1, userId2]
    );
    
    return parseInt(result.rows[0].count);
  }
}

module.exports = new ChatMessage();