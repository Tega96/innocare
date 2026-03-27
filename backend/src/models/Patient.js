// backend/src/models/Patient.js
const { query } = require('../config/database');

class Patient {
  constructor() {
    this.tableName = 'patients';
  }

  /**
   * Create patient profile
   */
  async create(patientData) {
    const {
      user_id, first_name, last_name, date_of_birth, address,
      emergency_contact_name, emergency_contact_phone,
      blood_group, genotype, allergies, current_pregnancy_week, expected_due_date
    } = patientData;
    
    const result = await query(
      `INSERT INTO patients 
       (id, user_id, first_name, last_name, date_of_birth, address,
        emergency_contact_name, emergency_contact_phone, blood_group, genotype,
        allergies, current_pregnancy_week, expected_due_date)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [user_id, first_name, last_name, date_of_birth, address,
       emergency_contact_name, emergency_contact_phone, blood_group, genotype,
       allergies, current_pregnancy_week, expected_due_date]
    );
    
    return result.rows[0];
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId) {
    const result = await query(
      `SELECT p.*, u.email, u.phone 
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Find patient by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT p.*, u.email, u.phone 
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Update patient profile
   */
  async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'first_name', 'last_name', 'date_of_birth', 'address',
      'emergency_contact_name', 'emergency_contact_phone',
      'blood_group', 'genotype', 'allergies',
      'current_pregnancy_week', 'expected_due_date'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(userId);
    
    const result = await query(
      `UPDATE patients SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Get patient's health records
   */
  async getHealthRecords(patientId, options = {}) {
    const { limit = 50, offset = 0, start_date, end_date } = options;
    
    let sql = `
      SELECT * FROM health_records 
      WHERE patient_id = $1
    `;
    const params = [patientId];
    let paramIndex = 2;
    
    if (start_date) {
      sql += ` AND recorded_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      sql += ` AND recorded_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    sql += ` ORDER BY recorded_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get patient's appointments
   */
  async getAppointments(patientId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT a.*, 
             d.first_name as doctor_first_name, 
             d.last_name as doctor_last_name,
             d.specialization,
             d.consultation_fee
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = $1
    `;
    const params = [patientId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY a.appointment_date DESC, a.start_time DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get patient's prescriptions
   */
  async getPrescriptions(patientId, status = 'active') {
    const result = await query(
      `SELECT p.*, 
              d.first_name as doctor_first_name, 
              d.last_name as doctor_last_name,
              array_agg(
                json_build_object(
                  'id', pi.id,
                  'medication_id', pi.medication_id,
                  'medication_name', m.name,
                  'dosage', pi.dosage,
                  'frequency', pi.frequency,
                  'duration_days', pi.duration_days,
                  'quantity', pi.quantity,
                  'instructions', pi.instructions
                )
              ) as items
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
       LEFT JOIN medications m ON pi.medication_id = m.id
       WHERE p.patient_id = $1
         AND p.status = $2
       GROUP BY p.id, d.first_name, d.last_name
       ORDER BY p.issued_date DESC`,
      [patientId, status]
    );
    
    return result.rows;
  }

  /**
   * Get patient's orders
   */
  async getOrders(patientId, options = {}) {
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
   * Get patient statistics
   */
  async getStats(patientId) {
    const result = await query(
      `SELECT 
         (SELECT COUNT(*) FROM appointments WHERE patient_id = $1) as total_appointments,
         (SELECT COUNT(*) FROM appointments WHERE patient_id = $1 AND status = 'completed') as completed_appointments,
         (SELECT COUNT(*) FROM health_records WHERE patient_id = $1) as total_health_records,
         (SELECT COUNT(*) FROM prescriptions WHERE patient_id = $1 AND status = 'active') as active_prescriptions,
         (SELECT COUNT(*) FROM orders WHERE patient_id = $1) as total_orders,
         (SELECT COUNT(*) FROM medical_records WHERE patient_id = $1) as total_medical_records,
         (SELECT current_pregnancy_week FROM patients WHERE id = $1) as current_pregnancy_week
       FROM patients WHERE id = $1`,
      [patientId]
    );
    
    return result.rows[0];
  }
}

module.exports = new Patient();