// backend/src/models/Doctor.js
const { query } = require('../config/database');

class Doctor {
  constructor() {
    this.tableName = 'doctors';
  }

  /**
   * Create doctor profile
   */
  async create(doctorData) {
    const {
      user_id, first_name, last_name, specialization, consultation_fee,
      hospital_name, hospital_address, years_of_experience, qualifications,
      available_days, available_time_start, available_time_end, max_appointments_per_day,
      bio
    } = doctorData;
    
    const result = await query(
      `INSERT INTO doctors 
       (id, user_id, first_name, last_name, specialization, consultation_fee,
        hospital_name, hospital_address, years_of_experience, qualifications,
        available_days, available_time_start, available_time_end, max_appointments_per_day,
        bio)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [user_id, first_name, last_name, specialization, consultation_fee,
       hospital_name, hospital_address, years_of_experience, qualifications,
       available_days, available_time_start, available_time_end, max_appointments_per_day || 10,
       bio]
    );
    
    return result.rows[0];
  }

  /**
   * Find doctor by user ID
   */
  async findByUserId(userId) {
    const result = await query(
      `SELECT d.*, u.email, u.phone 
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Find doctor by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT d.*, u.email, u.phone 
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Update doctor profile
   */
  async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'first_name', 'last_name', 'specialization', 'consultation_fee',
      'hospital_name', 'hospital_address', 'years_of_experience', 'qualifications',
      'available_days', 'available_time_start', 'available_time_end',
      'max_appointments_per_day', 'bio'
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
      `UPDATE doctors SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Search doctors
   */
  async search(filters = {}) {
    const {
      specialization, location, maxFee, rating, availableDay,
      search, page = 1, limit = 20
    } = filters;
    
    let sql = `
      SELECT d.*, u.email, u.phone,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(DISTINCT r.id) as total_reviews,
             COUNT(DISTINCT a.id) as total_appointments
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN doctor_reviews r ON d.id = r.doctor_id
      LEFT JOIN appointments a ON d.id = a.doctor_id
      WHERE d.is_verified = true AND u.is_active = true
    `;
    const params = [];
    let paramIndex = 1;
    
    if (specialization) {
      sql += ` AND d.specialization = $${paramIndex}`;
      params.push(specialization);
      paramIndex++;
    }
    
    if (search) {
      sql += ` AND (d.first_name ILIKE $${paramIndex} 
                OR d.last_name ILIKE $${paramIndex}
                OR d.specialization ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (maxFee) {
      sql += ` AND d.consultation_fee <= $${paramIndex}`;
      params.push(maxFee);
      paramIndex++;
    }
    
    if (availableDay) {
      sql += ` AND $${paramIndex} = ANY(d.available_days)`;
      params.push(availableDay);
      paramIndex++;
    }
    
    sql += ` GROUP BY d.id, u.email, u.phone`;
    
    if (rating) {
      sql += ` HAVING AVG(r.rating) >= $${paramIndex}`;
      params.push(rating);
      paramIndex++;
    }
    
    sql += ` ORDER BY avg_rating DESC, d.consultation_fee ASC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get doctor's patients
   */
  async getPatients(doctorId, options = {}) {
    const { search, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT DISTINCT p.id, p.first_name, p.last_name, p.date_of_birth,
             p.blood_group, p.current_pregnancy_week, p.expected_due_date,
             u.email, u.phone,
             MAX(a.appointment_date) as last_visit
      FROM patients p
      JOIN users u ON p.user_id = u.id
      JOIN appointments a ON p.id = a.patient_id
      WHERE a.doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (search) {
      sql += ` AND (p.first_name ILIKE $${paramIndex} 
                OR p.last_name ILIKE $${paramIndex}
                OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    sql += ` GROUP BY p.id, u.email, u.phone
             ORDER BY last_visit DESC NULLS LAST
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get doctor's appointments
   */
  async getAppointments(doctorId, options = {}) {
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
   * Get doctor's earnings
   */
  async getEarnings(doctorId, options = {}) {
    const { start_date, end_date } = options;
    
    let sql = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_earnings,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_earnings,
        COUNT(*) as total_transactions
      FROM doctor_earnings
      WHERE doctor_id = $1
    `;
    const params = [doctorId];
    let paramIndex = 2;
    
    if (start_date) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }
    
    if (end_date) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }
    
    const result = await query(sql, params);
    
    return result.rows[0];
  }

  /**
   * Get doctor's earnings by period
   */
  async getEarningsByPeriod(doctorId, period = 'month') {
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
   * Get doctor's withdrawal history
   */
  async getWithdrawals(doctorId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const result = await query(
      `SELECT * FROM withdrawals
       WHERE doctor_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(doctorId, amount, bankDetails) {
    const result = await query(
      `INSERT INTO withdrawals 
       (id, doctor_id, amount, bank_details, status)
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending')
       RETURNING *`,
      [doctorId, amount, bankDetails]
    );
    
    return result.rows[0];
  }

  /**
   * Update withdrawal status
   */
  async updateWithdrawalStatus(withdrawalId, status, reference = null) {
    const result = await query(
      `UPDATE withdrawals 
       SET status = $1, 
           reference = COALESCE($2, reference),
           processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE processed_at END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, reference, withdrawalId]
    );
    
    return result.rows[0];
  }

  /**
   * Get doctor's bank details
   */
  async getBankDetails(doctorId) {
    const result = await query(
      'SELECT * FROM doctor_bank_details WHERE doctor_id = $1',
      [doctorId]
    );
    
    return result.rows[0];
  }

  /**
   * Save bank details
   */
  async saveBankDetails(doctorId, bankDetails) {
    const { bank_name, account_number, account_name } = bankDetails;
    
    const result = await query(
      `INSERT INTO doctor_bank_details (doctor_id, bank_name, account_number, account_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (doctor_id) DO UPDATE 
       SET bank_name = EXCLUDED.bank_name,
           account_number = EXCLUDED.account_number,
           account_name = EXCLUDED.account_name,
           updated_at = NOW()
       RETURNING *`,
      [doctorId, bank_name, account_number, account_name]
    );
    
    return result.rows[0];
  }

  /**
   * Get doctor's statistics
   */
  async getStats(doctorId) {
    const result = await query(
      `SELECT 
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = $1) as total_appointments,
         (SELECT COUNT(*) FROM appointments WHERE doctor_id = $1 AND status = 'completed') as completed_appointments,
         (SELECT COUNT(*) FROM patients WHERE id IN 
           (SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = $1)) as total_patients,
         (SELECT COALESCE(AVG(rating), 0) FROM doctor_reviews WHERE doctor_id = $1) as avg_rating,
         (SELECT COUNT(*) FROM doctor_reviews WHERE doctor_id = $1) as total_reviews
       FROM doctors WHERE id = $1`,
      [doctorId]
    );
    
    return result.rows[0];
  }

  /**
   * Update doctor verification status
   */
  async verifyDoctor(doctorId, verified = true) {
    const result = await query(
      `UPDATE doctors 
       SET is_verified = $1, 
           verified_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [verified, doctorId]
    );
    
    return result.rows[0];
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(doctorId, date) {
    // Get doctor's schedule
    const doctor = await this.findById(doctorId);
    
    if (!doctor) {
      return [];
    }
    
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if doctor works on this day
    if (!doctor.available_days || !doctor.available_days.includes(dayOfWeek)) {
      return [];
    }
    
    // Get existing appointments for this date
    const existingAppointments = await query(
      `SELECT start_time FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 
       AND status NOT IN ('cancelled', 'no_show')`,
      [doctorId, date]
    );
    
    // Generate all possible time slots (1-hour intervals)
    const startTime = doctor.available_time_start;
    const endTime = doctor.available_time_end;
    const slots = [];
    
    let currentHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    
    while (currentHour < endHour) {
      const slotTime = `${currentHour.toString().padStart(2, '0')}:00:00`;
      
      // Check if slot is already booked
      const isBooked = existingAppointments.rows.some(
        apt => apt.start_time === slotTime
      );
      
      if (!isBooked) {
        slots.push({
          time: slotTime,
          available: true
        });
      }
      
      currentHour++;
    }
    
    // Check if doctor has reached max appointments for the day
    const appointmentCount = existingAppointments.rows.length;
    const remainingSlots = doctor.max_appointments_per_day - appointmentCount;
    
    return slots.slice(0, remainingSlots);
  }
}

module.exports = new Doctor();