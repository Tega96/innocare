// backend/src/controllers/uploadController.js
const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class UploadController {
  /**
   * Upload profile image
   * POST /api/upload/profile-image
   */
  async uploadProfileImage(req, res) {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid file type. Only images are allowed.' });
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profiles/${file.filename}`;
      
      // Update user profile based on role
      if (req.user.role === 'patient') {
        await query(
          'UPDATE patients SET profile_image_url = $1 WHERE user_id = $2',
          [fileUrl, req.user.id]
        );
      } else if (req.user.role === 'doctor') {
        await query(
          'UPDATE doctors SET profile_image_url = $1 WHERE user_id = $2',
          [fileUrl, req.user.id]
        );
      }
      
      logger.info(`Profile image uploaded for user ${req.user.id}`);
      
      res.json({
        message: 'Profile image uploaded successfully',
        url: fileUrl
      });
      
    } catch (error) {
      logger.error('Upload profile image error:', error);
      res.status(500).json({ error: 'Failed to upload profile image' });
    }
  }

  /**
   * Upload medical record
   * POST /api/upload/medical-record
   */
  async uploadMedicalRecord(req, res) {
    try {
      const file = req.file;
      const { title, type, notes } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid file type. Only images and PDFs are allowed.' });
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/medical_records/${file.filename}`;
      
      // Get patient ID
      const patient = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patient.rows.length === 0) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: 'Patient not found' });
      }
      
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
        record: result.rows[0],
        url: fileUrl
      });
      
    } catch (error) {
      logger.error('Upload medical record error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload medical record' });
    }
  }

  /**
   * Upload prescription
   * POST /api/upload/prescription
   */
  async uploadPrescription(req, res) {
    try {
      const file = req.file;
      const { appointmentId } = req.body;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid file type. Only images and PDFs are allowed.' });
      }
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/prescriptions/${file.filename}`;
      
      // Get doctor ID
      const doctor = await query(
        'SELECT id FROM doctors WHERE user_id = $1',
        [req.user.id]
      );
      
      if (doctor.rows.length === 0) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      // Get appointment details
      const appointment = await query(
        'SELECT patient_id FROM appointments WHERE id = $1 AND doctor_id = $2',
        [appointmentId, doctor.rows[0].id]
      );
      
      if (appointment.rows.length === 0) {
        fs.unlinkSync(file.path);
        return res.status(404).json({ error: 'Appointment not found' });
      }
      
      const result = await query(
        `INSERT INTO prescriptions 
         (patient_id, doctor_id, appointment_id, notes, status)
         VALUES ($1, $2, $3, $4, 'active')
         RETURNING *`,
        [appointment.rows[0].patient_id, doctor.rows[0].id, appointmentId, `Uploaded prescription: ${file.originalname}`]
      );
      
      logger.info(`Prescription uploaded for appointment ${appointmentId}`);
      
      res.status(201).json({
        message: 'Prescription uploaded successfully',
        prescription: result.rows[0],
        fileUrl
      });
      
    } catch (error) {
      logger.error('Upload prescription error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload prescription' });
    }
  }

  /**
   * Upload chat file
   * POST /api/upload/chat-file
   */
  async uploadChatFile(req, res) {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid file type' });
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${file.filename}`;
      
      res.json({
        message: 'File uploaded successfully',
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype
      });
      
    } catch (error) {
      logger.error('Upload chat file error:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  /**
   * Delete uploaded file
   * DELETE /api/upload/file/:filename
   */
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      const { folder = 'misc' } = req.query;
      
      const filePath = path.join(__dirname, `../../uploads/${folder}/${filename}`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`File deleted: ${filePath}`);
      }
      
      res.json({ message: 'File deleted successfully' });
      
    } catch (error) {
      logger.error('Delete file error:', error);
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
}

module.exports = new UploadController();