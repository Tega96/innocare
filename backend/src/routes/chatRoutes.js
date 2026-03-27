// backend/src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const sendMessageValidation = [
  body('recipientId').isUUID().withMessage('Valid recipient ID required'),
  body('message').notEmpty().withMessage('Message cannot be empty'),
  body('messageType').isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
  body('consentForRecords').optional().isBoolean()
];

router.use(authenticateToken);

// Messages
router.get('/messages/:userId', chatController.getMessages);
router.post('/messages', sendMessageValidation, validate, chatController.sendMessage);
router.post('/mark-read/:userId', chatController.markMessagesRead);
router.get('/unread-count', chatController.getUnreadCount);

// Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:userId', chatController.getConversation);
router.delete('/conversations/:userId', chatController.deleteConversation);

// File uploads for chat
router.post('/upload', chatController.uploadFile);

module.exports = router;