// backend/src/models/Payment.js
const { query } = require('../config/database');

class Payment {
  constructor() {
    this.tableName = 'payments';
  }

  /**
   * Create payment record
   */
  async create(paymentData) {
    const {
      user_id, appointment_id, order_id, amount, transaction_reference,
      payment_type, status
    } = paymentData;
    
    const result = await query(
      `INSERT INTO payments 
       (id, user_id, appointment_id, order_id, amount, transaction_reference,
        payment_type, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, appointment_id, order_id, amount, transaction_reference,
       payment_type, status || 'pending']
    );
    
    return result.rows[0];
  }

  /**
   * Find payment by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT p.*, 
              CASE 
                WHEN p.appointment_id IS NOT NULL THEN 'Consultation'
                WHEN p.order_id IS NOT NULL THEN 'Medication'
                ELSE 'Other'
              END as payment_type_name
       FROM payments p
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find payment by transaction reference
   */
  async findByReference(transactionRef) {
    const result = await query(
      'SELECT * FROM payments WHERE transaction_reference = $1',
      [transactionRef]
    );
    return result.rows[0];
  }

  /**
   * Update payment status
   */
  async updateStatus(id, status, data = {}) {
    const fields = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let paramIndex = 2;
    
    if (data.payment_method) {
      fields.push(`payment_method = $${paramIndex}`);
      values.push(data.payment_method);
      paramIndex++;
    }
    
    if (data.payment_details) {
      fields.push(`payment_details = $${paramIndex}`);
      values.push(data.payment_details);
      paramIndex++;
    }
    
    if (data.interswitch_response) {
      fields.push(`interswitch_response = $${paramIndex}`);
      values.push(data.interswitch_response);
      paramIndex++;
    }
    
    if (status === 'success') {
      fields.push(`paid_at = NOW()`);
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Process refund
   */
  async refund(id, reason) {
    const result = await query(
      `UPDATE payments 
       SET status = 'refunded', 
           refund_reason = $2,
           refund_date = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, reason]
    );
    
    return result.rows[0];
  }

  /**
   * Get payments by user
   */
  async getByUser(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT p.*, 
             CASE 
               WHEN p.appointment_id IS NOT NULL THEN 'Consultation'
               WHEN p.order_id IS NOT NULL THEN 'Medication'
               ELSE 'Other'
             END as payment_type_name
      FROM payments p
      WHERE p.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY p.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) FROM payments WHERE user_id = $1';
    const countParams = [userId];
    if (status) {
      countSql += ` AND status = $2`;
      countParams.push(status);
    }
    
    const countResult = await query(countSql, countParams);
    
    return {
      payments: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  }

  /**
   * Get payments by appointment
   */
  async getByAppointment(appointmentId) {
    const result = await query(
      'SELECT * FROM payments WHERE appointment_id = $1 ORDER BY created_at DESC',
      [appointmentId]
    );
    return result.rows;
  }

  /**
   * Get payments by order
   */
  async getByOrder(orderId) {
    const result = await query(
      'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );
    return result.rows;
  }

  /**
   * Get payment statistics
   */
  async getStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded,
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END), 0) as total_refunded,
        COALESCE(AVG(CASE WHEN status = 'success' THEN amount END), 0) as avg_transaction
      FROM payments
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get daily payment trends
   */
  async getDailyTrends(days = 30) {
    const result = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as total_transactions,
         SUM(amount) as total_amount,
         COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
         SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) as revenue
       FROM payments
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Get payment by period
   */
  async getByPeriod(startDate, endDate) {
    const result = await query(
      `SELECT * FROM payments 
       WHERE created_at BETWEEN $1 AND $2
       ORDER BY created_at ASC`,
      [startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Get pending payments
   */
  async getPending(olderThanMinutes = 30) {
    const result = await query(
      `SELECT * FROM payments 
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '1 minute' * $1`,
      [olderThanMinutes]
    );
    return result.rows;
  }
}

module.exports = new Payment();