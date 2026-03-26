const { query } = require('../config/database');
const moment = require('moment');
const notificationService = require('../services/notificationService');

/**
 * Appointment Controller
 * Handles booking, scheduling, and managing appointments
 */
class AppointmentController {
  /**
   * Search for available doctors based on patient needs
   * GET /api/appointments/doctors/search
   */
  async searchDoctors(req, res) {
    try {
      const { 
        specialization, 
        location, 
        date,
        maxFee,
        rating,
        page = 1,
        limit = 10
      } = req.query;
      
      let sql = `
        SELECT d.*, u.email, u.phone,
               COALESCE(AVG(r.rating), 0) as avg_rating,
               COUNT(DISTINCT a.id) as total_appointments
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN appointments a ON d.id = a.doctor_id
        WHERE d.is_verified = true
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (specialization) {
        sql += ` AND d.specialization = $${paramIndex}`;
        params.push(specialization);
        paramIndex++;
      }
      
      if (maxFee) {
        sql += ` AND d.consultation_fee <= $${paramIndex}`;
        params.push(maxFee);
        paramIndex++;
      }
      
      if (rating) {
        sql += ` HAVING AVG(r.rating) >= $${paramIndex}`;
        params.push(rating);
        paramIndex++;
      }
      
      sql += ` GROUP BY d.id, u.email, u.phone
               ORDER BY avg_rating DESC, d.consultation_fee ASC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      // Get available time slots for each doctor if date is provided
      if (date && result.rows.length > 0) {
        for (let doctor of result.rows) {
          doctor.available_slots = await this.getAvailableSlots(doctor.id, date);
        }
      }
      
      res.json({
        doctors: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      });
    } catch (error) {
      console.error('Search doctors error:', error);
      res.status(500).json({ error: 'Failed to search doctors' });
    }
  }
  
  /**
   * Get available time slots for a doctor on a specific date
   * GET /api/appointments/available-slots/:doctorId
   */
  async getAvailableSlots(doctorId, date) {
    try {
      // Get doctor's schedule
      const doctor = await query(
        'SELECT available_days, available_time_start, available_time_end, max_appointments_per_day FROM doctors WHERE id = $1',
        [doctorId]
      );
      
      if (doctor.rows.length === 0) {
        return [];
      }
      
      const doc = doctor.rows[0];
      const targetDate = moment(date);
      const dayOfWeek = targetDate.format('dddd');
      
      // Check if doctor works on this day
      if (!doc.available_days.includes(dayOfWeek)) {
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
      const startTime = moment(doc.available_time_start, 'HH:mm:ss');
      const endTime = moment(doc.available_time_end, 'HH:mm:ss');
      const slots = [];
      
      let currentSlot = startTime.clone();
      while (currentSlot < endTime) {
        const slotTime = currentSlot.format('HH:mm:ss');
        
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
        
        currentSlot.add(1, 'hour');
      }
      
      // Check if doctor has reached max appointments for the day
      const appointmentCount = existingAppointments.rows.length;
      const remainingSlots = doc.max_appointments_per_day - appointmentCount;
      
      return slots.slice(0, remainingSlots);
    } catch (error) {
      console.error('Get available slots error:', error);
      return [];
    }
  }
  
  /**
   * Book a new appointment
   * POST /api/appointments/book
   */
  async bookAppointment(req, res) {
    try {
      const {
        doctorId,
        appointmentDate,
        startTime,
        type,
        symptoms,
        notes,
        recordingConsent
      } = req.body;
      
      const patientId = req.user.id; // From auth middleware
      
      // Get patient details
      const patient = await query(
        'SELECT * FROM patients WHERE user_id = $1',
        [patientId]
      );
      
      if (patient.rows.length === 0) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      
      // Get doctor details
      const doctor = await query(
        'SELECT * FROM doctors WHERE id = $1',
        [doctorId]
      );
      
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      const doc = doctor.rows[0];
      const appointmentDateObj = moment(appointmentDate);
      const endTime = moment(startTime, 'HH:mm:ss').add(1, 'hour').format('HH:mm:ss');
      
      // Check if slot is available
      const availableSlots = await this.getAvailableSlots(doctorId, appointmentDate);
      const isSlotAvailable = availableSlots.some(slot => slot.time === startTime);
      
      if (!isSlotAvailable) {
        return res.status(400).json({ error: 'Selected time slot is not available' });
      }
      
      // Calculate payment amounts
      const platformFee = doc.consultation_fee * 0.10; // 10% platform fee
      const doctorEarnings = doc.consultation_fee - platformFee;
      
      // Create appointment
      const appointment = await query(
        `INSERT INTO appointments 
         (patient_id, doctor_id, appointment_date, start_time, end_time, 
          type, symptoms, notes, recording_consent, payment_amount, platform_fee, doctor_earnings, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [patient.rows[0].id, doctorId, appointmentDate, startTime, endTime,
         type, symptoms, notes, recordingConsent, doc.consultation_fee, platformFee, doctorEarnings, 'pending']
      );
      
      // Send notifications
      await notificationService.sendAppointmentConfirmation(
        patient.rows[0].user_id,
        appointment.rows[0]
      );
      
      await notificationService.sendNewAppointmentNotification(
        doc.user_id,
        appointment.rows[0]
      );
      
      res.status(201).json({
        message: 'Appointment booked successfully',
        appointment: appointment.rows[0],
        paymentRequired: doc.consultation_fee
      });
    } catch (error) {
      console.error('Book appointment error:', error);
      res.status(500).json({ error: 'Failed to book appointment' });
    }
  }
  
  /**
   * Get patient's appointments
   * GET /api/appointments/patient
   */
  async getPatientAppointments(req, res) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const patient = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patient.rows.length === 0) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      
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
      
      const params = [patient.rows[0].id];
      let paramIndex = 2;
      
      if (status) {
        sql += ` AND a.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      sql += ` ORDER BY a.appointment_date DESC, a.start_time DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      res.json({
        appointments: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      });
    } catch (error) {
      console.error('Get patient appointments error:', error);
      res.status(500).json({ error: 'Failed to get appointments' });
    }
  }
  
  /**
   * Get doctor's appointments
   * GET /api/appointments/doctor
   */
  async getDoctorAppointments(req, res) {
    try {
      const { date, status, page = 1, limit = 10 } = req.query;
      
      const doctor = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor profile not found' });
      }
      
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
      
      const params = [doctor.rows[0].id];
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
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      res.json({
        appointments: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      });
    } catch (error) {
      console.error('Get doctor appointments error:', error);
      res.status(500).json({ error: 'Failed to get appointments' });
    }
  }
  
  /**
   * Cancel appointment
   * PUT /api/appointments/:id/cancel
   */
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const appointment = await query(
        'SELECT * FROM appointments WHERE id = $1',
        [id]
      );
      
      if (appointment.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      const apt = appointment.rows[0];
      
      // Check if user has permission to cancel
      const isPatient = req.user.role === 'patient';
      const isDoctor = req.user.role === 'doctor';
      
      let hasPermission = false;
      let userId = null;
      
      if (isPatient) {
        const patient = await query(
          'SELECT id FROM patients WHERE user_id = $1',
          [req.user.id]
        );
        hasPermission = patient.rows[0]?.id === apt.patient_id;
        userId = patient.rows[0]?.user_id;
      } else if (isDoctor) {
        const doctor = await query(
          'SELECT id FROM doctors WHERE user_id = $1',
          [req.user.id]
        );
        hasPermission = doctor.rows[0]?.id === apt.doctor_id;
        userId = doctor.rows[0]?.user_id;
      }
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
      }
      
      // Check if cancellation is within allowed time (24 hours before)
      const appointmentDateTime = moment(`${apt.appointment_date} ${apt.start_time}`);
      const now = moment();
      const hoursDifference = appointmentDateTime.diff(now, 'hours');
      
      if (hoursDifference < 24) {
        return res.status(400).json({ 
          error: 'Appointments can only be cancelled at least 24 hours in advance' 
        });
      }
      
      // Update appointment status
      const updated = await query(
        `UPDATE appointments 
         SET status = 'cancelled', notes = CONCAT(notes, ' Cancellation reason: ', $2)
         WHERE id = $1 
         RETURNING *`,
        [id, reason]
      );
      
      // Send cancellation notification
      await notificationService.sendAppointmentCancellation(
        userId,
        updated.rows[0]
      );
      
      res.json({
        message: 'Appointment cancelled successfully',
        appointment: updated.rows[0]
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
  
  /**
   * Complete appointment (doctor only)
   * PUT /api/appointments/:id/complete
   */
  async completeAppointment(req, res) {
    try {
      const { id } = req.params;
      const { notes, prescription } = req.body;
      
      // Verify doctor owns this appointment
      const doctor = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      const appointment = await query(
        'SELECT * FROM appointments WHERE id = $1 AND doctor_id = $2',
        [id, doctor.rows[0].id]
      );
      
      if (appointment.rows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      // Update appointment
      const updated = await query(
        `UPDATE appointments 
         SET status = 'completed', notes = COALESCE($2, notes)
         WHERE id = $1 
         RETURNING *`,
        [id, notes]
      );
      
      // Create prescription if provided
      if (prescription && prescription.items && prescription.items.length > 0) {
        const prescriptionResult = await query(
          `INSERT INTO prescriptions 
           (patient_id, doctor_id, appointment_id, notes, status)
           VALUES ($1, $2, $3, $4, 'active')
           RETURNING *`,
          [appointment.rows[0].patient_id, doctor.rows[0].id, id, prescription.notes]
        );
        
        for (const item of prescription.items) {
          await query(
            `INSERT INTO prescription_items 
             (prescription_id, medication_id, dosage, frequency, duration_days, quantity, instructions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [prescriptionResult.rows[0].id, item.medicationId, item.dosage, 
             item.frequency, item.durationDays, item.quantity, item.instructions]
          );
        }
        
        // Notify patient about prescription
        await notificationService.sendPrescriptionNotification(
          appointment.rows[0].patient_id,
          prescriptionResult.rows[0]
        );
      }
      
      res.json({
        message: 'Appointment completed successfully',
        appointment: updated.rows[0]
      });
    } catch (error) {
      console.error('Complete appointment error:', error);
      res.status(500).json({ error: 'Failed to complete appointment' });
    }
  }
}

module.exports = new AppointmentController();