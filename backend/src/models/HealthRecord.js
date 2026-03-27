// backend/src/models/HealthRecord.js
const { query } = require('../config/database');

class HealthRecord {
  constructor() {
    this.tableName = 'health_records';
  }

  /**
   * Create health record
   */
  async create(recordData) {
    const {
      patient_id, blood_pressure_systolic, blood_pressure_diastolic,
      heart_rate, temperature, weight_kg, height_cm, fundal_height_cm,
      fetal_heart_rate, fetal_movements_per_day, symptoms, notes
    } = recordData;
    
    const result = await query(
      `INSERT INTO health_records 
       (id, patient_id, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, temperature, weight_kg, height_cm, fundal_height_cm,
        fetal_heart_rate, fetal_movements_per_day, symptoms, notes, recorded_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       RETURNING *`,
      [patient_id, blood_pressure_systolic, blood_pressure_diastolic,
       heart_rate, temperature, weight_kg, height_cm, fundal_height_cm,
       fetal_heart_rate, fetal_movements_per_day, symptoms, notes]
    );
    
    return result.rows[0];
  }

  /**
   * Find record by ID
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM health_records WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get patient's health records
   */
  async getByPatient(patientId, options = {}) {
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
   * Get latest record
   */
  async getLatest(patientId) {
    const result = await query(
      `SELECT * FROM health_records 
       WHERE patient_id = $1
       ORDER BY recorded_at DESC
       LIMIT 1`,
      [patientId]
    );
    
    return result.rows[0];
  }

  /**
   * Get health trends
   */
  async getTrends(patientId, period = 'month') {
    let interval;
    switch(period) {
      case 'week': interval = '1 day'; break;
      case 'month': interval = '1 day'; break;
      case 'year': interval = '1 month'; break;
      default: interval = '1 day';
    }
    
    const result = await query(
      `SELECT 
         DATE_TRUNC($1, recorded_at) as date,
         AVG(blood_pressure_systolic) as avg_systolic,
         AVG(blood_pressure_diastolic) as avg_diastolic,
         AVG(heart_rate) as avg_heart_rate,
         AVG(temperature) as avg_temperature,
         AVG(weight_kg) as avg_weight,
         AVG(fetal_heart_rate) as avg_fetal_heart_rate
       FROM health_records
       WHERE patient_id = $2
         AND recorded_at >= NOW() - INTERVAL '1 year'
       GROUP BY DATE_TRUNC($1, recorded_at)
       ORDER BY date ASC`,
      [interval, patientId]
    );
    
    return result.rows;
  }

  /**
   * Get health summary statistics
   */
  async getSummary(patientId) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_records,
         COUNT(CASE WHEN recorded_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_records,
         MIN(recorded_at) as first_record,
         MAX(recorded_at) as last_record,
         AVG(blood_pressure_systolic) as avg_systolic,
         AVG(blood_pressure_diastolic) as avg_diastolic,
         AVG(heart_rate) as avg_heart_rate,
         AVG(temperature) as avg_temperature,
         AVG(weight_kg) as avg_weight
       FROM health_records
       WHERE patient_id = $1`,
      [patientId]
    );
    
    return result.rows[0];
  }

  /**
   * Get abnormal readings
   */
  async getAbnormalReadings(patientId) {
    const result = await query(
      `SELECT * FROM health_records
       WHERE patient_id = $1
         AND (
           blood_pressure_systolic > 140 OR blood_pressure_systolic < 90 OR
           blood_pressure_diastolic > 90 OR blood_pressure_diastolic < 60 OR
           heart_rate > 100 OR heart_rate < 60 OR
           temperature > 37.2 OR temperature < 36.1 OR
           fetal_heart_rate > 160 OR fetal_heart_rate < 110
         )
       ORDER BY recorded_at DESC
       LIMIT 10`,
      [patientId]
    );
    
    return result.rows;
  }

  /**
   * Delete record
   */
  async delete(id, patientId) {
    const result = await query(
      `DELETE FROM health_records 
       WHERE id = $1 AND patient_id = $2
       RETURNING id`,
      [id, patientId]
    );
    
    return result.rows[0];
  }

  /**
   * Get patient's vitals over time
   */
  async getVitalsTimeline(patientId, days = 30) {
    const result = await query(
      `SELECT 
         recorded_at,
         blood_pressure_systolic,
         blood_pressure_diastolic,
         heart_rate,
         temperature,
         weight_kg,
         fetal_heart_rate
       FROM health_records
       WHERE patient_id = $1
         AND recorded_at >= NOW() - INTERVAL '1 day' * $2
       ORDER BY recorded_at ASC`,
      [patientId, days]
    );
    
    return result.rows;
  }

  /**
   * Get symptoms frequency
   */
  async getSymptomsFrequency(patientId, days = 30) {
    const result = await query(
      `SELECT 
         symptoms,
         COUNT(*) as frequency
       FROM health_records
       WHERE patient_id = $1
         AND symptoms IS NOT NULL
         AND symptoms != '{}'
         AND recorded_at >= NOW() - INTERVAL '1 day' * $2
       GROUP BY symptoms
       ORDER BY frequency DESC`,
      [patientId, days]
    );
    
    return result.rows;
  }

  /**
   * Get weight progression
   */
  async getWeightProgression(patientId) {
    const result = await query(
      `SELECT 
         recorded_at,
         weight_kg,
         current_pregnancy_week
       FROM health_records hr
       JOIN patients p ON hr.patient_id = p.id
       WHERE hr.patient_id = $1
         AND weight_kg IS NOT NULL
       ORDER BY recorded_at ASC`,
      [patientId]
    );
    
    return result.rows;
  }
}

module.exports = new HealthRecord();