const emailService = require('./emailService');
const smsService = require('./smsService');
const { query } = require('../config/database');

class NotificationService {
  async sendAppointmentConfirmation(userId, appointment) {
    try {
      // Get user details
      const userResult = await query(
        'SELECT email, phone FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) return;
      
      const user = userResult.rows[0];
      
      // Get doctor details
      const doctorResult = await query(
        'SELECT first_name, last_name FROM doctors WHERE id = $1',
        [appointment.doctor_id]
      );
      
      const doctorName = doctorResult.rows[0] ? 
        `${doctorResult.rows[0].first_name} ${doctorResult.rows[0].last_name}` : 
        'Your Doctor';
      
      const appointmentDetails = {
        date: appointment.appointment_date,
        time: appointment.start_time,
        doctorName,
        type: appointment.type
      };
      
      // Send email
      await emailService.sendAppointmentConfirmation(user.email, appointmentDetails);
      
      // Send SMS reminder (scheduled)
      // This would typically be queued for later
      
      return { success: true };
    } catch (error) {
      console.error('Notification error:', error);
      return { success: false };
    }
  }
  
  async sendNewAppointmentNotification(doctorUserId, appointment) {
    try {
      const userResult = await query(
        'SELECT email FROM users WHERE id = $1',
        [doctorUserId]
      );
      
      if (userResult.rows.length === 0) return;
      
      // Get patient details
      const patientResult = await query(
        'SELECT first_name, last_name FROM patients WHERE id = $1',
        [appointment.patient_id]
      );
      
      const patientName = patientResult.rows[0] ?
        `${patientResult.rows[0].first_name} ${patientResult.rows[0].last_name}` :
        'A patient';
      
      // Send email notification to doctor
      // This would be implemented similarly to above
      
      return { success: true };
    } catch (error) {
      console.error('Doctor notification error:', error);
      return { success: false };
    }
  }
  
  async sendPrescriptionNotification(patientId, prescription) {
    try {
      // Get patient user ID
      const patientResult = await query(
        'SELECT user_id FROM patients WHERE id = $1',
        [patientId]
      );
      
      if (patientResult.rows.length === 0) return;
      
      const userId = patientResult.rows[0].user_id;
      
      const userResult = await query(
        'SELECT email, phone FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) return;
      
      const user = userResult.rows[0];
      
      // Send email notification about prescription
      // This would be implemented
      
      return { success: true };
    } catch (error) {
      console.error('Prescription notification error:', error);
      return { success: false };
    }
  }
  
  async sendAppointmentCancellation(userId, appointment) {
    try {
      const userResult = await query(
        'SELECT email, phone FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) return;
      
      const user = userResult.rows[0];
      
      // Send cancellation email
      // This would be implemented
      
      return { success: true };
    } catch (error) {
      console.error('Cancellation notification error:', error);
      return { success: false };
    }
  }
}

module.exports = new NotificationService();