// backend/src/models/Appointment.js
const { query } = require('../config/database');
const moment = require('moment');

class Appointment {
  constructor() {
    this.tableName = 'appointments';
  }

  /**
   * Create appointment
   */
  async create(appointmentData) {
    const {
      patient_id, doctor_id, appointment_date, start_time, end_time,
      type, symptoms, notes, recording_consent, payment_amount,
      platform_fee, doctor_earnings
    } = appointmentData;
    
    const result = await query(
      `INSERT INTO appointments 
       (id, patient_id, doctor_id, appointment_date, start_time, end_time,
        type, symptoms, notes, recording_consent, payment_amount,
        platform_fee, doctor_earnings, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
       RETURNING *`,
      [patient_id, doctor_id, appointment_date, start_time, end_time,
       type, symptoms, notes, recording_consent, payment_amount,
       platform_fee, doctor_earnings]
    );
    
    return result.rows[0];
  }

  /**
   * Find appointment by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  /**
   * Update appointment
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'status', 'notes', 'payment_status', 'video_call_link',
      'call_started_at', 'call_ended_at', 'call_duration', 'call_status'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (updates.appointment_date) {
      fields.push(`appointment_date = $${paramIndex}`);
      values.push(updates.appointment_date);
      paramIndex++;
    }
    
    if (updates.start_time) {
      fields.push(`start_time = $${paramIndex}`);
      values.push(updates.start_time);
      paramIndex++;
    }
    
    if (updates.end_time) {
      fields.push(`end_time = $${paramIndex}`);
      values.push(updates.end_time);
      paramIndex++;
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await query(
      `UPDATE appointments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Cancel appointment
   */
  async cancel(id, reason) {
    const result = await query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           notes = CONCAT(COALESCE(notes, ''), ' Cancellation reason: ', $2),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, reason]
    );
    
    return result.rows[0];
  }

  /**
   * Reschedule appointment
   */
  async reschedule(id, newDate, newTime) {
    const endTime = moment(newTime, 'HH:mm:ss').add(1, 'hour').format('HH:mm:ss');
    
    const result = await query(
      `UPDATE appointments 
       SET appointment_date = $1, 
           start_time = $2, 
           end_time = $3,
           status = 'confirmed',
           updated_at = NOW()
       WHERE id = $4 
       RETURNING *`,
      [newDate, newTime, endTime, id]
    );
    
    return result.rows[0];
  }

  /**
   * Complete appointment
   */
  async complete(id, notes) {
    const result = await query(
      `UPDATE appointments 
       SET status = 'completed', 
           notes = COALESCE($2, notes),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, notes]
    );
    
    return result.rows[0];
  }

  /**
   * Get appointments by patient
   */
  async getByPatient(patientId, options = {}) {
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
   * Get appointments by doctor
   */
  async getByDoctor(doctorId, options = {}) {
    const { date, status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT a.*, 
             p.first_name as patient_first_name, 
             p.last_name as patient_last_name,
             p.date_of_birth,
             p.blood_group,
             p.current_pregnancy_week
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (date) {
      sql += ` AND a.appointment_date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    if (status) {
      sql += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    sql += ` ORDER BY a.appointment_date ASC, a.start_time ASC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get upcoming appointments
   */
  async getUpcoming(limit = 10) {
    const result = await query(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.appointment_date >= CURRENT_DATE
         AND a.status = 'confirmed'
       ORDER BY a.appointment_date ASC, a.start_time ASC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  /**
   * Check if time slot is available
   */
  async isSlotAvailable(doctorId, date, startTime) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM appointments
       WHERE doctor_id = $1 
         AND appointment_date = $2 
         AND start_time = $3
         AND status NOT IN ('cancelled', 'no_show')`,
      [doctorId, date, startTime]
    );
    
    return parseInt(result.rows[0].count) === 0;
  }

  /**
   * Get appointment statistics
   */
  async getStats(doctorId = null, startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as video,
        COUNT(CASE WHEN type = 'in_person' THEN 1 END) as in_person,
        COALESCE(SUM(payment_amount), 0) as total_revenue
      FROM appointments
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (doctorId) {
      sql += ` AND doctor_id = $${paramIndex}`;
      params.push(doctorId);
      paramIndex++;
    }
    
    if (startDate) {
      sql += ` AND appointment_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND appointment_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    const result = await query(sql, params);
    
    return result.rows[0];
  }

  /**
   * Get appointment trends
   */
  async getTrends(doctorId = null, period = 'month') {
    let interval;
    switch(period) {
      case 'week': interval = '1 day'; break;
      case 'month': interval = '1 day'; break;
      case 'year': interval = '1 month'; break;
      default: interval = '1 day';
    }
    
    let sql = `
      SELECT 
        DATE_TRUNC($1, appointment_date) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COALESCE(SUM(payment_amount), 0) as revenue
      FROM appointments
      WHERE appointment_date >= NOW() - INTERVAL '1 year'
    `;
    const params = [interval];
    let paramIndex = 2;
    
    if (doctorId) {
      sql += ` AND doctor_id = $${paramIndex}`;
      params.push(doctorId);
      paramIndex++;
    }
    
    sql += ` GROUP BY DATE_TRUNC($1, appointment_date)
             ORDER BY date ASC`;
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get appointments needing reminders
   */
  async getAppointmentsNeedingReminder(hours = 24) {
    const result = await query(
      `SELECT a.*, 
              p.first_name as patient_first_name, 
              p.last_name as patient_last_name,
              p.user_id as patient_user_id,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              d.user_id as doctor_user_id
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.status = 'confirmed'
         AND a.appointment_date = CURRENT_DATE + INTERVAL '1 day'
         AND a.reminder_sent = false`,
      []
    );
    
    return result.rows;
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(id) {
    await query(
      'UPDATE appointments SET reminder_sent = true, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }
}

module.exports = new Appointment();