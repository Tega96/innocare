// backend/src/controllers/doctorController.js
const { query } = require('../config/database');
const logger = require('../utils/logger');

class DoctorController {
  /**
   * Get doctor profile
   * GET /api/doctors/profile
   */
  async getProfile(req, res) {
    try {
      const result = await query(
        `SELECT d.*, u.email, u.phone, u.is_email_verified, u.is_phone_verified
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         WHERE d.user_id = $1`,
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * Update doctor profile
   * PUT /api/doctors/profile
   */
  async updateProfile(req, res) {
    try {
      const {
        first_name, last_name, specialization, qualifications,
        years_of_experience, consultation_fee, hospital_name, hospital_address,
        available_days, available_time_start, available_time_end, max_appointments_per_day,
        bio
      } = req.body;
      
      const result = await query(
        `UPDATE doctors 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             specialization = COALESCE($3, specialization),
             qualifications = COALESCE($4, qualifications),
             years_of_experience = COALESCE($5, years_of_experience),
             consultation_fee = COALESCE($6, consultation_fee),
             hospital_name = COALESCE($7, hospital_name),
             hospital_address = COALESCE($8, hospital_address),
             available_days = COALESCE($9, available_days),
             available_time_start = COALESCE($10, available_time_start),
             available_time_end = COALESCE($11, available_time_end),
             max_appointments_per_day = COALESCE($12, max_appointments_per_day),
             bio = COALESCE($13, bio),
             updated_at = NOW()
         WHERE user_id = $14
         RETURNING *`,
        [first_name, last_name, specialization, qualifications, years_of_experience,
         consultation_fee, hospital_name, hospital_address, available_days,
         available_time_start, available_time_end, max_appointments_per_day,
         bio, req.user.id]
      );
      
      res.json({
        message: 'Profile updated successfully',
        profile: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * Get doctor's patients
   * GET /api/doctors/patients
   */
  async getPatients(req, res) {
    try {
      const { limit = 50, offset = 0, search } = req.query;
      
      let queryText = `
        SELECT DISTINCT p.id, p.first_name, p.last_name, p.date_of_birth,
               p.blood_group, p.current_pregnancy_week, p.expected_due_date,
               u.email, u.phone,
               MAX(a.appointment_date) as last_visit
        FROM patients p
        JOIN users u ON p.user_id = u.id
        JOIN appointments a ON p.id = a.patient_id
        WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (search) {
        queryText += ` AND (p.first_name ILIKE $${paramIndex} 
                        OR p.last_name ILIKE $${paramIndex}
                        OR u.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      queryText += ` GROUP BY p.id, u.email, u.phone
                     ORDER BY last_visit DESC NULLS LAST
                     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await query(queryText, params);
      
      res.json({
        patients: result.rows,
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get patients error:', error);
      res.status(500).json({ error: 'Failed to get patients' });
    }
  }

  /**
   * Get patient details
   * GET /api/doctors/patients/:patientId
   */
  async getPatientDetails(req, res) {
    try {
      const { patientId } = req.params;
      
      const result = await query(
        `SELECT p.*, u.email, u.phone
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [patientId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      res.json({ patient: result.rows[0] });
      
    } catch (error) {
      logger.error('Get patient details error:', error);
      res.status(500).json({ error: 'Failed to get patient details' });
    }
  }

  /**
   * Get patient health records
   * GET /api/doctors/patients/:patientId/health-records
   */
  async getPatientHealthRecords(req, res) {
    try {
      const { patientId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
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
      res.status(500).json({ error: 'Failed to get health records' });
    }
  }

  /**
   * Get doctor's appointments
   * GET /api/doctors/appointments
   */
  async getAppointments(req, res) {
    try {
      const { date, status, limit = 50, offset = 0 } = req.query;
      
      let queryText = `
        SELECT a.*, 
               p.first_name as patient_first_name, 
               p.last_name as patient_last_name,
               p.date_of_birth,
               p.blood_group,
               p.current_pregnancy_week
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (date) {
        queryText += ` AND a.appointment_date = $${paramIndex}`;
        params.push(date);
        paramIndex++;
      }
      
      if (status) {
        queryText += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      queryText += ` ORDER BY a.appointment_date ASC, a.start_time ASC
                     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await query(queryText, params);
      
      res.json({
        appointments: result.rows,
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get appointments error:', error);
      res.status(500).json({ error: 'Failed to get appointments' });
    }
  }

  /**
   * Update appointment status
   * PUT /api/doctors/appointments/:id/status
   */
  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const result = await query(
        `UPDATE appointments 
         SET status = $1, 
             notes = COALESCE($2, notes),
             updated_at = NOW()
         WHERE id = $3 
           AND doctor_id = (SELECT id FROM doctors WHERE user_id = $4)
         RETURNING *`,
        [status, notes, id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      logger.info(`Appointment ${id} status updated to ${status} by doctor ${req.user.id}`);
      
      res.json({
        message: 'Appointment status updated',
        appointment: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Update appointment status error:', error);
      res.status(500).json({ error: 'Failed to update appointment status' });
    }
  }

  /**
   * Create prescription
   * POST /api/doctors/appointments/:id/prescription
   */
  async createPrescription(req, res) {
    try {
      const { id } = req.params;
      const { items, notes } = req.body;
      
      // Get appointment details
      const appointment = await query(
        `SELECT patient_id FROM appointments 
         WHERE id = $1 AND doctor_id = (SELECT id FROM doctors WHERE user_id = $2)`,
        [id, req.user.id]
      );
      
      if (appointment.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // Create prescription
      const prescription = await query(
        `INSERT INTO prescriptions 
         (patient_id, doctor_id, appointment_id, notes, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING *`,
        [appointment.rows[0].patient_id, 
         (await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id])).rows[0].id,
         id, notes]
      );
      
      // Add prescription items
      for (const item of items) {
        await query(
          `INSERT INTO prescription_items 
           (prescription_id, medication_id, dosage, frequency, duration_days, quantity, instructions)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [prescription.rows[0].id, item.medicationId, item.dosage, 
           item.frequency, item.durationDays, item.quantity, item.instructions]
        );
      }
      
      logger.info(`Prescription created for appointment ${id}`);
      
      res.status(201).json({
        message: 'Prescription created successfully',
        prescription: prescription.rows[0]
      });
      
    } catch (error) {
      logger.error('Create prescription error:', error);
      res.status(500).json({ error: 'Failed to create prescription' });
    }
  }

  /**
   * Get earnings
   * GET /api/doctors/earnings
   */
  async getEarnings(req, res) {
    try {
      const { range = 'month' } = req.query;
      
      const doctorId = (await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id])).rows[0].id;
      
      // Total earnings
      const totalResult = await query(
        `SELECT COALESCE(SUM(net_amount), 0) as total,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN net_amount ELSE 0 END), 0) as paid
         FROM doctor_earnings
         WHERE doctor_id = $1`,
        [doctorId]
      );
      
      // Weekly/Monthly data
      let dateCondition = '';
      if (range === 'week') {
        dateCondition = "AND created_at >= NOW() - INTERVAL '7 days'";
      } else if (range === 'month') {
        dateCondition = "AND created_at >= NOW() - INTERVAL '30 days'";
      } else if (range === 'year') {
        dateCondition = "AND created_at >= NOW() - INTERVAL '365 days'";
      }
      
      const trendResult = await query(
        `SELECT DATE(created_at) as date, SUM(net_amount) as amount
         FROM doctor_earnings
         WHERE doctor_id = $1 ${dateCondition}
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [doctorId]
      );
      
      res.json({
        totalEarnings: totalResult.rows[0].total,
        pendingEarnings: totalResult.rows[0].pending,
        paidEarnings: totalResult.rows[0].paid,
        trends: trendResult.rows
      });
      
    } catch (error) {
      logger.error('Get earnings error:', error);
      res.status(500).json({ error: 'Failed to get earnings' });
    }
  }

  /**
   * Request withdrawal
   * POST /api/doctors/withdraw
   */
  async requestWithdrawal(req, res) {
    try {
      const { amount } = req.body;
      
      const doctorId = (await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id])).rows[0].id;
      
      // Check available earnings
      const earnings = await query(
        'SELECT COALESCE(SUM(net_amount), 0) as pending FROM doctor_earnings WHERE doctor_id = $1 AND status = $2',
        [doctorId, 'pending']
      );
      
      if (earnings.rows[0].pending < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Get bank details
      const bankDetails = await query(
        'SELECT * FROM doctor_bank_details WHERE doctor_id = $1',
        [doctorId]
      );
      
      if (bankDetails.rows.length === 0) {
        return res.status(400).json({ error: 'Please add bank details first' });
      }
      
      // Create withdrawal request
      const withdrawal = await query(
        `INSERT INTO withdrawals 
         (doctor_id, amount, bank_details, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [doctorId, amount, bankDetails.rows[0]]
      );
      
      logger.info(`Withdrawal request of ${amount} by doctor ${req.user.id}`);
      
      res.json({
        message: 'Withdrawal request submitted successfully',
        withdrawal: withdrawal.rows[0]
      });
      
    } catch (error) {
      logger.error('Request withdrawal error:', error);
      res.status(500).json({ error: 'Failed to request withdrawal' });
    }
  }

  /**
   * Get bank details
   * GET /api/doctors/bank-details
   */
  async getBankDetails(req, res) {
    try {
      const result = await query(
        `SELECT * FROM doctor_bank_details 
         WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = $1)`,
        [req.user.id]
      );
      
      res.json({ bankDetails: result.rows[0] || null });
      
    } catch (error) {
      logger.error('Get bank details error:', error);
      res.status(500).json({ error: 'Failed to get bank details' });
    }
  }

  /**
   * Save bank details
   * POST /api/doctors/bank-details
   */
  async saveBankDetails(req, res) {
    try {
      const { bank_name, account_number, account_name } = req.body;
      
      const doctorId = (await query('SELECT id FROM doctors WHERE user_id = $1', [req.user.id])).rows[0].id;
      
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
      
      res.json({
        message: 'Bank details saved successfully',
        bankDetails: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Save bank details error:', error);
      res.status(500).json({ error: 'Failed to save bank details' });
    }
  }
}

module.exports = new DoctorController();