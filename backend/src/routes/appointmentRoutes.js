// backend/src/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const bookAppointmentValidation = [
  body('doctorId').isUUID().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).withMessage('Valid time is required'),
  body('type').isIn(['video', 'in_person']).withMessage('Invalid appointment type'),
  body('symptoms').optional().isString(),
  body('notes').optional().isString(),
  body('recordingConsent').optional().isBoolean()
];

// Public routes (require authentication but no role restriction)
router.use(authenticateToken);

// Search and availability
router.get('/doctors/search', appointmentController.searchDoctors);
router.get('/available-slots/:doctorId', appointmentController.getAvailableSlots);
router.get('/doctor/:doctorId/schedule', appointmentController.getDoctorSchedule);

// Booking and management
router.post('/book', bookAppointmentValidation, validate, appointmentController.bookAppointment);
router.get('/patient', appointmentController.getPatientAppointments);
router.get('/doctor', appointmentController.getDoctorAppointments);
router.get('/:id', appointmentController.getAppointmentDetails);
router.put('/:id/cancel', appointmentController.cancelAppointment);
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);
router.put('/:id/complete', appointmentController.completeAppointment);

module.exports = router;