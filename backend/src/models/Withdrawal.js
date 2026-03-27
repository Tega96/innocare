// backend/src/models/Withdrawal.js
const { query } = require('../config/database');

class Withdrawal {
  constructor() {
    this.tableName = 'withdrawals';
  }

  /**
   * Create withdrawal request
   */
  async create(withdrawalData) {
    const {
      doctor_id, amount, bank_details, status
    } = withdrawalData;
    
    const result = await query(
      `INSERT INTO withdrawals 
       (id, doctor_id, amount, bank_details, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       RETURNING *`,
      [doctor_id, amount, bank_details, status || 'pending']
    );
    
    return result.rows[0];
  }

  /**
   * Find withdrawal by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT w.*, 
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name
       FROM withdrawals w
       JOIN doctors d ON w.doctor_id = d.id
       WHERE w.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get withdrawals by doctor
   */
  async getByDoctor(doctorId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT * FROM withdrawals
      WHERE doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get all withdrawals (admin)
   */
  async getAll(options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT w.*, 
             d.first_name as doctor_first_name,
             d.last_name as doctor_last_name,
             d.email as doctor_email
      FROM withdrawals w
      JOIN doctors d ON w.doctor_id = d.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      sql += ` AND w.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY w.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Update withdrawal status
   */
  async updateStatus(id, status, reference = null, notes = null) {
    const result = await query(
      `UPDATE withdrawals 
       SET status = $1, 
           reference = COALESCE($2, reference),
           processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, reference, notes, id]
    );
    return result.rows[0];
  }

  /**
   * Get pending withdrawals
   */
  async getPending() {
    const result = await query(
      `SELECT w.*, 
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              d.email as doctor_email,
              d.phone as doctor_phone
       FROM withdrawals w
       JOIN doctors d ON w.doctor_id = d.id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC`,
      []
    );
    return result.rows;
  }

  /**
   * Get withdrawal statistics
   */
  async getStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM withdrawals
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
   * Get withdrawal by reference
   */
  async findByReference(reference) {
    const result = await query(
      'SELECT * FROM withdrawals WHERE reference = $1',
      [reference]
    );
    return result.rows[0];
  }
}

module.exports = new Withdrawal();