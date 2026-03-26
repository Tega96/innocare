// backend/src/config/socket.js
const { query } = require('./database');

const setupSocket = (io) => {
  // Track online users
  const onlineUsers = new Map();
  
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists
      const result = await query(
        'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }
      
      socket.userId = decoded.userId;
      socket.userRole = result.rows[0].role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);
    
    // Store online user
    onlineUsers.set(socket.userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Handle joining chat room
    socket.on('join-chat', (data) => {
      const { appointmentId, otherUserId } = data;
      const roomName = `chat:${[socket.userId, otherUserId].sort().join(':')}`;
      socket.join(roomName);
      socket.currentRoom = roomName;
    });
    
    // Handle sending message
    socket.on('send-message', async (data) => {
      try {
        const { recipientId, message, messageType, appointmentId, consentForRecords } = data;
        
        // Save message to database
        const result = await query(
          `INSERT INTO chat_messages 
           (sender_id, recipient_id, appointment_id, message, message_type, consent_for_records)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, created_at`,
          [socket.userId, recipientId, appointmentId, message, messageType || 'text', consentForRecords || false]
        );
        
        const savedMessage = {
          id: result.rows[0].id,
          senderId: socket.userId,
          recipientId,
          message,
          messageType: messageType || 'text',
          createdAt: result.rows[0].created_at,
          isRead: false
        };
        
        // Send to recipient if online
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new-message', savedMessage);
        }
        
        // Send confirmation to sender
        socket.emit('message-sent', savedMessage);
        
        // Update appointment if needed
        if (appointmentId) {
          await query(
            'UPDATE appointments SET updated_at = NOW() WHERE id = $1',
            [appointmentId]
          );
        }
      } catch (error) {
        console.error('Message save error:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });
    
    // Handle marking messages as read
    socket.on('mark-read', async (data) => {
      try {
        const { senderId } = data;
        
        await query(
          `UPDATE chat_messages 
           SET is_read = true, read_at = NOW()
           WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
          [senderId, socket.userId]
        );
        
        // Notify sender that messages were read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages-read', { byUser: socket.userId });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-typing', {
          userId: socket.userId,
          isTyping
        });
      }
    });
    
    // Handle video call signaling
    socket.on('video-call-offer', (data) => {
      const { recipientId, offer, appointmentId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('video-call-offer', {
          from: socket.userId,
          offer,
          appointmentId
        });
      }
    });
    
    socket.on('video-call-answer', (data) => {
      const { recipientId, answer } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('video-call-answer', {
          from: socket.userId,
          answer
        });
      }
    });
    
    socket.on('ice-candidate', (data) => {
      const { recipientId, candidate } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('ice-candidate', {
          from: socket.userId,
          candidate
        });
      }
    });
    
    socket.on('end-call', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('call-ended', {
          from: socket.userId
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
    });
  });
};

module.exports = { setupSocket };