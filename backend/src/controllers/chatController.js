// backend/src/controllers/chatController.js
const { query } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class ChatController {
  /**
   * Get messages between two users
   * GET /api/chat/messages/:userId
   */
  async getMessages(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
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
        [req.user.id, userId, parseInt(limit), parseInt(offset)]
      );
      
      res.json({
        messages: result.rows.reverse(),
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  /**
   * Send message
   * POST /api/chat/messages
   */
  async sendMessage(req, res) {
    try {
      const { recipientId, message, messageType, consentForRecords } = req.body;
      
      const result = await query(
        `INSERT INTO chat_messages 
         (sender_id, recipient_id, message, message_type, consent_for_records)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, recipientId, message, messageType || 'text', consentForRecords || false]
      );
      
      logger.info(`Message sent from ${req.user.id} to ${recipientId}`);
      
      res.status(201).json({
        message: 'Message sent successfully',
        messageData: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * Mark messages as read
   * POST /api/chat/mark-read/:userId
   */
  async markMessagesRead(req, res) {
    try {
      const { userId } = req.params;
      
      await query(
        `UPDATE chat_messages 
         SET is_read = true, read_at = NOW()
         WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
        [userId, req.user.id]
      );
      
      res.json({ message: 'Messages marked as read' });
      
    } catch (error) {
      logger.error('Mark messages read error:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }

  /**
   * Get unread message count
   * GET /api/chat/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count
         FROM chat_messages
         WHERE recipient_id = $1 AND is_read = false`,
        [req.user.id]
      );
      
      res.json({ unreadCount: parseInt(result.rows[0].count) });
      
    } catch (error) {
      logger.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }

  /**
   * Get conversations list
   * GET /api/chat/conversations
   */
  async getConversations(req, res) {
    try {
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
                COALESCE(p.last_name, d.last_name) as other_last_name
         FROM last_messages lm
         JOIN users u ON (u.id = lm.sender_id OR u.id = lm.recipient_id) AND u.id != $1
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         ORDER BY lm.created_at DESC`,
        [req.user.id]
      );
      
      res.json({ conversations: result.rows });
      
    } catch (error) {
      logger.error('Get conversations error:', error);
      res.status(500).json({ error: 'Failed to get conversations' });
    }
  }

  /**
   * Get single conversation
   * GET /api/chat/conversations/:userId
   */
  async getConversation(req, res) {
    try {
      const { userId } = req.params;
      
      const result = await query(
        `SELECT cm.*,
                u_sender.email as sender_email,
                u_recipient.email as recipient_email
         FROM chat_messages cm
         JOIN users u_sender ON cm.sender_id = u_sender.id
         JOIN users u_recipient ON cm.recipient_id = u_recipient.id
         WHERE (cm.sender_id = $1 AND cm.recipient_id = $2)
            OR (cm.sender_id = $2 AND cm.recipient_id = $1)
         ORDER BY cm.created_at ASC`,
        [req.user.id, userId]
      );
      
      // Get other user info
      const otherUser = await query(
        `SELECT u.id, u.email, u.role,
                COALESCE(p.first_name, d.first_name) as first_name,
                COALESCE(p.last_name, d.last_name) as last_name
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      res.json({
        conversation: result.rows,
        otherUser: otherUser.rows[0] || null
      });
      
    } catch (error) {
      logger.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to get conversation' });
    }
  }

  /**
   * Delete conversation
   * DELETE /api/chat/conversations/:userId
   */
  async deleteConversation(req, res) {
    try {
      const { userId } = req.params;
      
      await query(
        `DELETE FROM chat_messages
         WHERE (sender_id = $1 AND recipient_id = $2)
            OR (sender_id = $2 AND recipient_id = $1)`,
        [req.user.id, userId]
      );
      
      logger.info(`Conversation deleted between ${req.user.id} and ${userId}`);
      
      res.json({ message: 'Conversation deleted successfully' });
      
    } catch (error) {
      logger.error('Delete conversation error:', error);
      res.status(500).json({ error: 'Failed to delete conversation' });
    }
  }

  /**
   * Upload file for chat
   * POST /api/chat/upload
   */
  async uploadFile(req, res) {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${file.filename}`;
      
      res.json({
        message: 'File uploaded successfully',
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });
      
    } catch (error) {
      logger.error('Upload file error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
}

module.exports = new ChatController();