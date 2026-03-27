// backend/src/models/MedicalRecord.js
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

class MedicalRecord {
  constructor() {
    this.tableName = 'medical_records';
  }

  /**
   * Upload medical record
   */
  async create(recordData) {
    const {
      patient_id, title, type, file_name, file_path, file_type, file_size, notes
    } = recordData;
    
    const result = await query(
      `INSERT INTO medical_records 
       (id, patient_id, title, type, file_name, file_path, file_type, file_size, notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patient_id, title, type, file_name, file_path, file_type, file_size, notes]
    );
    
    return result.rows[0];
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT mr.*, 
              p.first_name as patient_first_name,
              p.last_name as patient_last_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get records by patient
   */
  async getByPatient(patientId, options = {}) {
    const { type, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT * FROM medical_records
      WHERE patient_id = $1
    `;
    const params = [patientId];
    let paramIndex = 2;
    
    if (type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    sql += ` ORDER BY created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Delete record
   */
  async delete(id, patientId) {
    // Get record first to delete file
    const record = await this.findById(id);
    
    if (!record) {
      return null;
    }
    
    // Delete file from disk
    if (record.file_path && fs.existsSync(record.file_path)) {
      fs.unlinkSync(record.file_path);
    }
    
    const result = await query(
      `DELETE FROM medical_records 
       WHERE id = $1 AND patient_id = $2
       RETURNING id`,
      [id, patientId]
    );
    
    return result.rows[0];
  }

  /**
   * Get record types
   */
  async getTypes() {
    const result = await query(
      'SELECT DISTINCT type FROM medical_records ORDER BY type',
      []
    );
    return result.rows.map(r => r.type);
  }

  /**
   * Get records by date range
   */
  async getByDateRange(patientId, startDate, endDate) {
    const result = await query(
      `SELECT * FROM medical_records
       WHERE patient_id = $1
         AND created_at BETWEEN $2 AND $3
       ORDER BY created_at DESC`,
      [patientId, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Get record count by type
   */
  async getCountByType(patientId) {
    const result = await query(
      `SELECT type, COUNT(*) as count
       FROM medical_records
       WHERE patient_id = $1
       GROUP BY type`,
      [patientId]
    );
    return result.rows;
  }
}

module.exports = new MedicalRecord();