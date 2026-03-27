// backend/src/models/Prescription.js
const { query } = require('../config/database');

class Prescription {
  constructor() {
    this.tableName = 'prescriptions';
  }

  /**
   * Create prescription
   */
  async create(prescriptionData) {
    const {
      patient_id, doctor_id, appointment_id, notes, status
    } = prescriptionData;
    
    const result = await query(
      `INSERT INTO prescriptions 
       (id, patient_id, doctor_id, appointment_id, notes, status, issued_date)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [patient_id, doctor_id, appointment_id, notes, status || 'active']
    );
    
    return result.rows[0];
  }

  /**
   * Add prescription item
   */
  async addItem(itemData) {
    const {
      prescription_id, medication_id, dosage, frequency,
      duration_days, quantity, instructions
    } = itemData;
    
    const result = await query(
      `INSERT INTO prescription_items 
       (id, prescription_id, medication_id, dosage, frequency,
        duration_days, quantity, instructions)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [prescription_id, medication_id, dosage, frequency,
       duration_days, quantity, instructions]
    );
    
    return result.rows[0];
  }

  /**
   * Add multiple items
   */
  async addItems(prescriptionId, items) {
    const results = [];
    for (const item of items) {
      const result = await this.addItem({ ...item, prescription_id: prescriptionId });
      results.push(result);
    }
    return results;
  }

  /**
   * Find prescription by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT p.*, 
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              pat.first_name as patient_first_name,
              pat.last_name as patient_last_name,
              array_agg(
                json_build_object(
                  'id', pi.id,
                  'medication_id', pi.medication_id,
                  'medication_name', m.name,
                  'dosage', pi.dosage,
                  'frequency', pi.frequency,
                  'duration_days', pi.duration_days,
                  'quantity', pi.quantity,
                  'instructions', pi.instructions,
                  'price', m.price
                )
              ) as items
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN patients pat ON p.patient_id = pat.id
       LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
       LEFT JOIN medications m ON pi.medication_id = m.id
       WHERE p.id = $1
       GROUP BY p.id, d.first_name, d.last_name, pat.first_name, pat.last_name`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Get prescriptions by patient
   */
  async getByPatient(patientId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT p.*, 
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
    `;
    const params = [patientId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` GROUP BY p.id, d.first_name, d.last_name
             ORDER BY p.issued_date DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get prescriptions by doctor
   */
  async getByDoctor(doctorId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT p.*, 
             pat.first_name as patient_first_name,
             pat.last_name as patient_last_name,
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
      JOIN patients pat ON p.patient_id = pat.id
      LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
      LEFT JOIN medications m ON pi.medication_id = m.id
      WHERE p.doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (status) {
      sql += ` AND p.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` GROUP BY p.id, pat.first_name, pat.last_name
             ORDER BY p.issued_date DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Update prescription status
   */
  async updateStatus(id, status) {
    const result = await query(
      `UPDATE prescriptions 
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  /**
   * Get active prescriptions count
   */
  async getActiveCount(patientId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = $1 AND status = $2',
      [patientId, 'active']
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get expiring prescriptions
   */
  async getExpiring(days = 7) {
    const result = await query(
      `SELECT p.*, 
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              pat.first_name as patient_first_name,
              pat.last_name as patient_last_name
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN patients pat ON p.patient_id = pat.id
       WHERE p.status = 'active'
         AND p.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
       ORDER BY p.expiry_date ASC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Get prescription statistics
   */
  async getStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_prescriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'dispensed' THEN 1 END) as dispensed,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        AVG(EXTRACT(DAY FROM (expiry_date - issued_date))) as avg_validity_days
      FROM prescriptions
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      sql += ` AND issued_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND issued_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    const result = await query(sql, params);
    return result.rows[0];
  }
}

module.exports = new Prescription();