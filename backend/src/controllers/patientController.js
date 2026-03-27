// backend/src/controllers/patientController.js
const { query } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class PatientController {
  /**
   * Get patient profile
   * GET /api/patients/profile
   */
  async getProfile(req, res) {
    try {
      const result = await query(
        `SELECT p.*, u.email, u.phone, u.is_email_verified, u.is_phone_verified
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1`,
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  /**
   * Update patient profile
   * PUT /api/patients/profile
   */
  async updateProfile(req, res) {
    try {
      const { 
        first_name, last_name, date_of_birth, address, 
        emergency_contact_name, emergency_contact_phone,
        blood_group, genotype, allergies, current_pregnancy_week, expected_due_date
      } = req.body;
      
      const result = await query(
        `UPDATE patients 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             date_of_birth = COALESCE($3, date_of_birth),
             address = COALESCE($4, address),
             emergency_contact_name = COALESCE($5, emergency_contact_name),
             emergency_contact_phone = COALESCE($6, emergency_contact_phone),
             blood_group = COALESCE($7, blood_group),
             genotype = COALESCE($8, genotype),
             allergies = COALESCE($9, allergies),
             current_pregnancy_week = COALESCE($10, current_pregnancy_week),
             expected_due_date = COALESCE($11, expected_due_date),
             updated_at = NOW()
         WHERE user_id = $12
         RETURNING *`,
        [first_name, last_name, date_of_birth, address, emergency_contact_name, 
         emergency_contact_phone, blood_group, genotype, allergies, 
         current_pregnancy_week, expected_due_date, req.user.id]
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
   * Get health records
   * GET /api/patients/health-records
   */
  async getHealthRecords(req, res) {
    try {
      const { limit = 50, offset = 0, start_date, end_date } = req.query;
      
      let queryText = `
        SELECT * FROM health_records 
        WHERE patient_id = (SELECT id FROM patients WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (start_date) {
        queryText += ` AND recorded_at >= $${paramIndex}`;
        params.push(start_date);
        paramIndex++;
      }
      
      if (end_date) {
        queryText += ` AND recorded_at <= $${paramIndex}`;
        params.push(end_date);
        paramIndex++;
      }
      
      queryText += ` ORDER BY recorded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await query(queryText, params);
      
      res.json({
        records: result.rows,
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get health records error:', error);
      res.status(500).json({ error: 'Failed to get health records' });
    }
  }

  /**
   * Add health record
   * POST /api/patients/health-records
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
         (patient_id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
          temperature, weight_kg, height_cm, fundal_height_cm,
          fetal_heart_rate, fetal_movements_per_day, symptoms, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [patient.rows[0].id, blood_pressure_systolic, blood_pressure_diastolic, heart_rate,
         temperature, weight_kg, height_cm, fundal_height_cm,
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
   * Get medical records
   * GET /api/patients/medical-records
   */
  async getMedicalRecords(req, res) {
    try {
      const result = await query(
        `SELECT * FROM medical_records 
         WHERE patient_id = (SELECT id FROM patients WHERE user_id = $1)
         ORDER BY created_at DESC`,
        [req.user.id]
      );
      
      res.json({ records: result.rows });
      
    } catch (error) {
      logger.error('Get medical records error:', error);
      res.status(500).json({ error: 'Failed to get medical records' });
    }
  }

  /**
   * Upload medical record
   * POST /api/patients/medical-records
   */
  async uploadMedicalRecord(req, res) {
    try {
      const { title, type, notes } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Get patient ID
      const patient = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      const result = await query(
        `INSERT INTO medical_records 
         (patient_id, title, type, file_name, file_path, file_type, file_size, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [patient.rows[0].id, title, type, file.originalname, file.path, 
         file.mimetype, file.size, notes]
      );
      
      logger.info(`Medical record uploaded for patient ${req.user.id}`);
      
      res.status(201).json({
        message: 'Medical record uploaded successfully',
        record: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Upload medical record error:', error);
      res.status(500).json({ error: 'Failed to upload medical record' });
    }
  }

  /**
   * Get appointments
   * GET /api/patients/appointments
   */
  async getAppointments(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      let queryText = `
        SELECT a.*, 
               d.first_name as doctor_first_name, 
               d.last_name as doctor_last_name,
               d.specialization,
               d.consultation_fee
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = (SELECT id FROM patients WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (status) {
        queryText += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      queryText += ` ORDER BY a.appointment_date DESC, a.start_time DESC
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
   * Get prescriptions
   * GET /api/patients/prescriptions
   */
  async getPrescriptions(req, res) {
    try {
      const result = await query(
        `SELECT p.*, 
                d.first_name as doctor_first_name, 
                d.last_name as doctor_last_name,
                array_agg(pi.*) as items
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
         WHERE p.patient_id = (SELECT id FROM patients WHERE user_id = $1)
         GROUP BY p.id, d.first_name, d.last_name
         ORDER BY p.issued_date DESC`,
        [req.user.id]
      );
      
      res.json({ prescriptions: result.rows });
      
    } catch (error) {
      logger.error('Get prescriptions error:', error);
      res.status(500).json({ error: 'Failed to get prescriptions' });
    }
  }

  /**
   * Get orders
   * GET /api/patients/orders
   */
  async getOrders(req, res) {
    try {
      const result = await query(
        `SELECT o.*, 
                array_agg(oi.*) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.patient_id = (SELECT id FROM patients WHERE user_id = $1)
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      
      res.json({ orders: result.rows });
      
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  }

  /**
   * Get chat doctors
   * GET /api/patients/chat/doctors
   */
  async getChatDoctors(req, res) {
    try {
      const result = await query(
        `SELECT d.id, d.first_name, d.last_name, d.specialization,
                u.email, u.phone
         FROM doctors d
         JOIN users u ON d.user_id = u.id
         WHERE d.is_verified = true AND u.is_active = true
         ORDER BY d.first_name`,
        []
      );
      
      res.json({ doctors: result.rows });
      
    } catch (error) {
      logger.error('Get chat doctors error:', error);
      res.status(500).json({ error: 'Failed to get doctors' });
    }
  }

  /**
   * Get chat messages
   * GET /api/patients/chat/messages/:doctorId
   */
  async getChatMessages(req, res) {
    try {
      const { doctorId } = req.params;
      
      // Get doctor's user ID
      const doctor = await query(
        'SELECT user_id FROM doctors WHERE id = $1',
        [doctorId]
      );
      
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      const result = await query(
        `SELECT * FROM chat_messages 
         WHERE (sender_id = $1 AND recipient_id = $2)
            OR (sender_id = $2 AND recipient_id = $1)
         ORDER BY created_at ASC`,
        [req.user.id, doctor.rows[0].user_id]
      );
      
      res.json({ messages: result.rows });
      
    } catch (error) {
      logger.error('Get chat messages error:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  }

  /**
   * Send message
   * POST /api/patients/chat/messages
   */
  async sendMessage(req, res) {
    try {
      const { recipientId, message, messageType, consentForRecords } = req.body;
      
      const result = await query(
        `INSERT INTO chat_messages 
         (sender_id, recipient_id, message, message_type, consent_for_records)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, recipientId, message, messageType || 'text', consentForRecords || false]
      );
      
      // Emit socket event (handled in socket setup)
      req.app.get('io').to(`user:${recipientId}`).emit('new-message', result.rows[0]);
      
      res.status(201).json({
        message: 'Message sent successfully',
        message: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * Mark messages as read
   * POST /api/patients/chat/mark-read/:doctorId
   */
  async markMessagesRead(req, res) {
    try {
      const { doctorId } = req.params;
      
      // Get doctor's user ID
      const doctor = await query(
        'SELECT user_id FROM doctors WHERE id = $1',
        [doctorId]
      );
      
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      await query(
        `UPDATE chat_messages 
         SET is_read = true, read_at = NOW()
         WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false`,
        [doctor.rows[0].user_id, req.user.id]
      );
      
      res.json({ message: 'Messages marked as read' });
      
    } catch (error) {
      logger.error('Mark messages read error:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }
}

module.exports = new PatientController();