// backend/src/models/Order.js
const { query } = require('../config/database');

class Order {
  constructor() {
    this.tableName = 'orders';
  }

  /**
   * Create order
   */
  async create(orderData) {
    const {
      patient_id, order_type, prescription_id, total_amount,
      delivery_address, status, payment_status
    } = orderData;
    
    const result = await query(
      `INSERT INTO orders 
       (id, patient_id, order_type, prescription_id, total_amount,
        delivery_address, status, payment_status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patient_id, order_type, prescription_id, total_amount,
       delivery_address, status || 'pending', payment_status || 'pending']
    );
    
    return result.rows[0];
  }

  /**
   * Add order item
   */
  async addItem(orderId, itemData) {
    const { medication_id, quantity, price } = itemData;
    
    const result = await query(
      `INSERT INTO order_items 
       (id, order_id, medication_id, quantity, price)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [orderId, medication_id, quantity, price]
    );
    
    return result.rows[0];
  }

  /**
   * Add multiple order items
   */
  async addItems(orderId, items) {
    const results = [];
    for (const item of items) {
      const result = await this.addItem(orderId, item);
      results.push(result);
    }
    return results;
  }

  /**
   * Find order by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT o.*, 
              p.first_name as patient_first_name,
              p.last_name as patient_last_name,
              array_agg(
                json_build_object(
                  'id', oi.id,
                  'medication_id', oi.medication_id,
                  'medication_name', m.name,
                  'quantity', oi.quantity,
                  'price', oi.price
                )
              ) as items
       FROM orders o
       JOIN patients p ON o.patient_id = p.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN medications m ON oi.medication_id = m.id
       WHERE o.id = $1
       GROUP BY o.id, p.first_name, p.last_name`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Get orders by patient
   */
  async getByPatient(patientId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT o.*, 
             array_agg(
               json_build_object(
                 'id', oi.id,
                 'medication_id', oi.medication_id,
                 'medication_name', m.name,
                 'quantity', oi.quantity,
                 'price', oi.price
               )
             ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN medications m ON oi.medication_id = m.id
      WHERE o.patient_id = $1
    `;
    const params = [patientId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` GROUP BY o.id
             ORDER BY o.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Update order status
   */
  async updateStatus(id, status) {
    const result = await query(
      `UPDATE orders 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id, paymentStatus, paymentId = null) {
    const result = await query(
      `UPDATE orders 
       SET payment_status = $1, 
           payment_id = COALESCE($2, payment_id),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [paymentStatus, paymentId, id]
    );
    return result.rows[0];
  }

  /**
   * Cancel order
   */
  async cancel(id, reason = null) {
    const result = await query(
      `UPDATE orders 
       SET status = 'cancelled', 
           cancellation_reason = COALESCE($2, cancellation_reason),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, reason]
    );
    return result.rows[0];
  }

  /**
   * Get orders by status
   */
  async getByStatus(status, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const result = await query(
      `SELECT o.*, 
              p.first_name as patient_first_name,
              p.last_name as patient_last_name,
              p.address as patient_address,
              u.email as patient_email,
              u.phone as patient_phone
       FROM orders o
       JOIN patients p ON o.patient_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE o.status = $1
       ORDER BY o.created_at ASC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Get order statistics
   */
  async getStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN order_type = 'prescription' THEN 1 END) as prescription_orders,
        COUNT(CASE WHEN order_type = 'over_the_counter' THEN 1 END) as otc_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders
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
   * Get daily order trends
   */
  async getDailyTrends(days = 30) {
    const result = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as total_orders,
         SUM(total_amount) as revenue,
         COUNT(CASE WHEN order_type = 'prescription' THEN 1 END) as prescription_orders,
         COUNT(CASE WHEN order_type = 'over_the_counter' THEN 1 END) as otc_orders
       FROM orders
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Get pending orders count
   */
  async getPendingCount() {
    const result = await query(
      'SELECT COUNT(*) as count FROM orders WHERE status = $1',
      ['pending']
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new Order();