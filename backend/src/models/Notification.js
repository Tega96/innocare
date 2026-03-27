// backend/src/models/Notification.js
const { query } = require('../config/database');

class Notification {
  constructor() {
    this.tableName = 'notifications';
  }

  /**
   * Create notification
   */
  async create(notificationData) {
    const {
      user_id, title, message, type, reference_id, reference_type
    } = notificationData;
    
    const result = await query(
      `INSERT INTO notifications 
       (id, user_id, title, message, type, reference_id, reference_type)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, message, type, reference_id, reference_type]
    );
    
    return result.rows[0];
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    const { unread_only = false, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (unread_only) {
      sql += ` AND is_read = false`;
    }
    
    sql += ` ORDER BY created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id, userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return result.rows[0];
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false
       RETURNING *`,
      [userId]
    );
    return result.rows;
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete notification
   */
  async delete(id, userId) {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }

  /**
   * Delete all notifications for user
   */
  async deleteAll(userId) {
    const result = await query(
      'DELETE FROM notifications WHERE user_id = $1 RETURNING id',
      [userId]
    );
    return result.rows;
  }

  /**
   * Create appointment reminder notification
   */
  async createAppointmentReminder(appointment) {
    const patientResult = await query(
      'SELECT user_id FROM patients WHERE id = $1',
      [appointment.patient_id]
    );
    
    if (patientResult.rows.length > 0) {
      await this.create({
        user_id: patientResult.rows[0].user_id,
        title: 'Appointment Reminder',
        message: `You have an appointment with Dr. ${appointment.doctor_name} on ${appointment.appointment_date} at ${appointment.start_time}`,
        type: 'appointment',
        reference_id: appointment.id,
        reference_type: 'appointment'
      });
    }
  }

  /**
   * Create payment confirmation notification
   */
  async createPaymentConfirmation(payment, user) {
    await this.create({
      user_id: user.id,
      title: 'Payment Successful',
      message: `Your payment of ₦${payment.amount} was successful. Reference: ${payment.transaction_reference}`,
      type: 'payment',
      reference_id: payment.id,
      reference_type: 'payment'
    });
  }

  /**
   * Create prescription notification
   */
  async createPrescriptionNotification(prescription, patientId) {
    const patientResult = await query(
      'SELECT user_id FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (patientResult.rows.length > 0) {
      await this.create({
        user_id: patientResult.rows[0].user_id,
        title: 'New Prescription',
        message: 'You have a new prescription from your doctor. Please log in to view details.',
        type: 'prescription',
        reference_id: prescription.id,
        reference_type: 'prescription'
      });
    }
  }

  /**
   * Create order status notification
   */
  async createOrderStatusNotification(order, patientId) {
    const patientResult = await query(
      'SELECT user_id FROM patients WHERE id = $1',
      [patientId]
    );
    
    if (patientResult.rows.length > 0) {
      let statusMessage = '';
      switch(order.status) {
        case 'processing':
          statusMessage = 'is being processed';
          break;
        case 'shipped':
          statusMessage = 'has been shipped';
          break;
        case 'delivered':
          statusMessage = 'has been delivered';
          break;
        case 'cancelled':
          statusMessage = 'has been cancelled';
          break;
        default:
          statusMessage = 'has been updated';
      }
      
      await this.create({
        user_id: patientResult.rows[0].user_id,
        title: 'Order Status Update',
        message: `Your order #${order.id} ${statusMessage}.`,
        type: 'order',
        reference_id: order.id,
        reference_type: 'order'
      });
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(userId = null) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
        COUNT(CASE WHEN type = 'appointment' THEN 1 END) as appointment_notifications,
        COUNT(CASE WHEN type = 'payment' THEN 1 END) as payment_notifications,
        COUNT(CASE WHEN type = 'prescription' THEN 1 END) as prescription_notifications,
        COUNT(CASE WHEN type = 'order' THEN 1 END) as order_notifications
      FROM notifications
    `;
    const params = [];
    
    if (userId) {
      sql += ` WHERE user_id = $1`;
      params.push(userId);
    }
    
    const result = await query(sql, params);
    return result.rows[0];
  }
}

module.exports = new Notification();