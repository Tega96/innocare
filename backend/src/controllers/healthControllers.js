// backend/src/controllers/healthController.js
const { query } = require('../config/database');
const logger = require('../utils/logger');

class HealthController {
  /**
   * Get patient's health records
   * GET /api/health/records
   */
  async getHealthRecords(req, res) {
    try {
      const { limit = 50, offset = 0, start_date, end_date } = req.query;
      
      let queryText = `
        SELECT hr.*, 
               EXTRACT(WEEK FROM hr.recorded_at) as week,
               TO_CHAR(hr.recorded_at, 'YYYY-MM-DD') as record_date
        FROM health_records hr
        WHERE hr.patient_id = (SELECT id FROM patients WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (start_date) {
        queryText += ` AND hr.recorded_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }
      
      if (end_date) {
        queryText += ` AND hr.recorded_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }
      
      queryText += ` ORDER BY hr.recorded_at DESC
                     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await query(queryText, params);
      
      res.json({
        records: result.rows,
        total: result.rowCount,
        page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        limit: parseInt(limit)
      });
      
    } catch (error) {
      logger.error('Get health records error:', error);
      res.status(500).json({ error: 'Failed to get health records' });
    }
  }

  /**
   * Add health record
   * POST /api/health/record
   */
  async addHealthRecord(req, res) {
    try {
      const {
        blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
        temperature, weight_kg, height_cm, fundal_height_cm,
        fetal_heart_rate, fetal_movements_per_day, symptoms, notes
      } = req.body;
      
      // Get patient ID
      const patient = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patient.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      const result = await query(
        `INSERT INTO health_records 
         (patient_id, recorded_at, blood_pressure_systolic, blood_pressure_diastolic, 
          heart_rate, temperature, weight_kg, height_cm, fundal_height_cm,
          fetal_heart_rate, fetal_movements_per_day, symptoms, notes)
         VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [patient.rows[0].id, blood_pressure_systolic, blood_pressure_diastolic, 
         heart_rate, temperature, weight_kg, height_cm, fundal_height_cm,
         fetal_heart_rate, fetal_movements_per_day, symptoms, notes]
      );
      
      logger.info(`Health record added for patient ${req.user.id}`);
      
      res.status(201).json({
        message: 'Health record added successfully',
        record: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Add health record error:', error);
      res.status(500).json({ error: 'Failed to add health record' });
    }
  }

  /**
   * Get single health record
   * GET /api/health/records/:id
   */
  async getHealthRecord(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT hr.* 
         FROM health_records hr
         JOIN patients p ON hr.patient_id = p.id
         WHERE hr.id = $1 AND p.user_id = $2`,
        [id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Health record not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get health record error:', error);
      res.status(500).json({ error: 'Failed to get health record' });
    }
  }

  /**
   * Delete health record
   * DELETE /api/health/records/:id
   */
  async deleteHealthRecord(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `DELETE FROM health_records 
         WHERE id = $1 AND patient_id = (SELECT id FROM patients WHERE user_id = $2)
         RETURNING id`,
        [id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Health record not found' });
      }
      
      logger.info(`Health record ${id} deleted by patient ${req.user.id}`);
      
      res.json({ message: 'Health record deleted successfully' });
      
    } catch (error) {
      logger.error('Delete health record error:', error);
      res.status(500).json({ error: 'Failed to delete health record' });
    }
  }

  /**
   * Get health trends (aggregated data)
   * GET /api/health/trends
   */
  async getHealthTrends(req, res) {
    try {
      const { period = 'month' } = req.query;
      
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
         WHERE patient_id = (SELECT id FROM patients WHERE user_id = $2)
           AND recorded_at >= NOW() - INTERVAL '1 year'
         GROUP BY DATE_TRUNC($1, recorded_at)
         ORDER BY date ASC`,
        [interval, req.user.id]
      );
      
      res.json({
        trends: result.rows,
        period
      });
      
    } catch (error) {
      logger.error('Get health trends error:', error);
      res.status(500).json({ error: 'Failed to get health trends' });
    }
  }

  /**
   * Get health summary (latest stats and insights)
   * GET /api/health/summary
   */
  async getHealthSummary(req, res) {
    try {
      // Get latest record
      const latest = await query(
        `SELECT * FROM health_records
         WHERE patient_id = (SELECT id FROM patients WHERE user_id = $1)
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [req.user.id]
      );
      
      // Get averages for last 30 days
      const averages = await query(
        `SELECT 
           AVG(blood_pressure_systolic) as avg_systolic,
           AVG(blood_pressure_diastolic) as avg_diastolic,
           AVG(heart_rate) as avg_heart_rate,
           AVG(temperature) as avg_temperature,
           AVG(weight_kg) as avg_weight
         FROM health_records
         WHERE patient_id = (SELECT id FROM patients WHERE user_id = $1)
           AND recorded_at >= NOW() - INTERVAL '30 days'`,
        [req.user.id]
      );
      
      // Get record count
      const count = await query(
        `SELECT COUNT(*) as total_records,
                COUNT(CASE WHEN recorded_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_records
         FROM health_records
         WHERE patient_id = (SELECT id FROM patients WHERE user_id = $1)`,
        [req.user.id]
      );
      
      res.json({
        latest: latest.rows[0] || null,
        averages: averages.rows[0] || null,
        stats: count.rows[0] || { total_records: 0, recent_records: 0 }
      });
      
    } catch (error) {
      logger.error('Get health summary error:', error);
      res.status(500).json({ error: 'Failed to get health summary' });
    }
  }

  /**
   * Get patient health records (for doctors)
   * GET /api/health/patient/:patientId
   */
  async getPatientHealthRecords(req, res) {
    try {
      const { patientId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Verify doctor has access to this patient
      const doctorId = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      const access = await query(
        `SELECT 1 FROM appointments 
         WHERE doctor_id = $1 AND patient_id = $2
         LIMIT 1`,
        [doctorId.rows[0]?.id, patientId]
      );
      
      if (access.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view this patient\'s records' });
      }
      
      const result = await query(
        `SELECT * FROM health_records 
         WHERE patient_id = $1
         ORDER BY recorded_at DESC
         LIMIT $2 OFFSET $3`,
        [patientId, parseInt(limit), parseInt(offset)]
      );
      
      res.json({
        records: result.rows,
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get patient health records error:', error);
      res.status(500).json({ error: 'Failed to get patient health records' });
    }
  }

  /**
   * Get patient health summary (for doctors)
   * GET /api/health/patient/:patientId/summary
   */
  async getPatientHealthSummary(req, res) {
    try {
      const { patientId } = req.params;
      
      // Verify doctor has access
      const doctorId = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      const access = await query(
        `SELECT 1 FROM appointments 
         WHERE doctor_id = $1 AND patient_id = $2
         LIMIT 1`,
        [doctorId.rows[0]?.id, patientId]
      );
      
      if (access.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to view this patient\'s records' });
      }
      
      // Get latest record
      const latest = await query(
        `SELECT * FROM health_records
         WHERE patient_id = $1
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [patientId]
      );
      
      // Get trends
      const trends = await query(
        `SELECT 
           DATE_TRUNC('day', recorded_at) as date,
           blood_pressure_systolic,
           blood_pressure_diastolic,
           heart_rate,
           weight_kg,
           fetal_heart_rate
         FROM health_records
         WHERE patient_id = $1
           AND recorded_at >= NOW() - INTERVAL '30 days'
         ORDER BY recorded_at ASC`,
        [patientId]
      );
      
      res.json({
        latest: latest.rows[0] || null,
        trends: trends.rows
      });
      
    } catch (error) {
      logger.error('Get patient health summary error:', error);
      res.status(500).json({ error: 'Failed to get patient health summary' });
    }
  }
}

module.exports = new HealthController();