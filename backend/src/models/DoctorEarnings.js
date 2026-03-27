// backend/src/models/DoctorEarnings.js
const { query } = require('../config/database');

class DoctorEarnings {
  constructor() {
    this.tableName = 'doctor_earnings';
  }

  /**
   * Create earnings record
   */
  async create(earningsData) {
    const {
      doctor_id, appointment_id, amount, platform_fee, net_amount, status
    } = earningsData;
    
    const result = await query(
      `INSERT INTO doctor_earnings 
       (id, doctor_id, appointment_id, amount, platform_fee, net_amount, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [doctor_id, appointment_id, amount, platform_fee, net_amount, status || 'pending']
    );
    
    return result.rows[0];
  }

  /**
   * Get earnings by doctor
   */
  async getByDoctor(doctorId, options = {}) {
    const { status, start_date, end_date, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT de.*, 
             a.appointment_date,
             p.first_name as patient_first_name,
             p.last_name as patient_last_name
      FROM doctor_earnings de
      JOIN appointments a ON de.appointment_id = a.id
      JOIN patients p ON a.patient_id = p.id
      WHERE de.doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND de.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (start_date) {
      sql += ` AND de.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      sql += ` AND de.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    sql += ` ORDER BY de.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get earnings summary
   */
  async getSummary(doctorId) {
    const result = await query(
      `SELECT 
         COALESCE(SUM(net_amount), 0) as total_earnings,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0) as pending_earnings,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN net_amount ELSE 0 END), 0) as paid_earnings,
         COUNT(*) as total_transactions,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
         COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_transactions
       FROM doctor_earnings
       WHERE doctor_id = $1`,
      [doctorId]
    );
    return result.rows[0];
  }

  /**
   * Get earnings by period
   */
  async getByPeriod(doctorId, period = 'month') {
    let interval;
    switch(period) {
      case 'week': interval = '1 day'; break;
      case 'month': interval = '1 day'; break;
      case 'year': interval = '1 month'; break;
      default: interval = '1 day';
    }
    
    const result = await query(
      `SELECT 
         DATE_TRUNC($1, created_at) as period,
         SUM(net_amount) as earnings,
         COUNT(*) as transaction_count
       FROM doctor_earnings
       WHERE doctor_id = $2
         AND created_at >= NOW() - INTERVAL '1 year'
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY period ASC`,
      [interval, doctorId]
    );
    
    return result.rows;
  }

  /**
   * Update earnings status
   */
  async updateStatus(id, status, reference = null) {
    const result = await query(
      `UPDATE doctor_earnings 
       SET status = $1, 
           paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
           reference = COALESCE($2, reference),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, reference, id]
    );
    return result.rows[0];
  }

  /**
   * Get earnings for withdrawal
   */
  async getPendingForWithdrawal(doctorId) {
    const result = await query(
      `SELECT * FROM doctor_earnings
       WHERE doctor_id = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
      [doctorId]
    );
    return result.rows;
  }

  /**
   * Mark earnings as paid
   */
  async markAsPaid(ids, reference) {
    const result = await query(
      `UPDATE doctor_earnings 
       SET status = 'paid', 
           paid_at = NOW(),
           reference = $1,
           updated_at = NOW()
       WHERE id = ANY($2::uuid[])
       RETURNING *`,
      [reference, ids]
    );
    return result.rows;
  }

  /**
   * Get earnings statistics by month
   */
  async getMonthlyStats(doctorId, year) {
    const result = await query(
      `SELECT 
         EXTRACT(MONTH FROM created_at) as month,
         SUM(net_amount) as earnings,
         COUNT(*) as transaction_count
       FROM doctor_earnings
       WHERE doctor_id = $1
         AND EXTRACT(YEAR FROM created_at) = $2
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month ASC`,
      [doctorId, year]
    );
    return result.rows;
  }

  /**
   * Get total earnings for all doctors
   */
  async getTotalEarnings(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        SUM(net_amount) as total_earnings,
        SUM(platform_fee) as total_platform_fee,
        COUNT(*) as total_transactions
      FROM doctor_earnings
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
}

module.exports = new DoctorEarnings();