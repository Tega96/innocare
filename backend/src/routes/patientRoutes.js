// backend/src/routes/patientRoutes.js
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// All routes require authentication and patient role
router.use(authenticateToken, authorizeRole('patient'));

// Profile routes
router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.post('/profile/image', patientController.uploadProfileImage);

// Health records
router.get('/health-records', patientController.getHealthRecords);
router.post('/health-records', patientController.addHealthRecord);
router.get('/health-records/:id', patientController.getHealthRecord);
router.delete('/health-records/:id', patientController.deleteHealthRecord);

// Medical records
router.get('/medical-records', patientController.getMedicalRecords);
router.post('/medical-records', patientController.uploadMedicalRecord);
router.get('/medical-records/:id/download', patientController.downloadMedicalRecord);
router.delete('/medical-records/:id', patientController.deleteMedicalRecord);

// Appointments
router.get('/appointments', patientController.getAppointments);
router.get('/appointments/:id', patientController.getAppointmentDetails);
router.post('/appointments/:id/cancel', patientController.cancelAppointment);
router.post('/appointments/:id/reschedule', patientController.rescheduleAppointment);

// Prescriptions
router.get('/prescriptions', patientController.getPrescriptions);
router.get('/prescriptions/:id', patientController.getPrescriptionDetails);
router.post('/prescriptions/:id/order', patientController.orderPrescription);

// Orders
router.get('/orders', patientController.getOrders);
router.get('/orders/:id', patientController.getOrderDetails);
router.post('/orders/:id/cancel', patientController.cancelOrder);

// Chat
router.get('/chat/doctors', patientController.getChatDoctors);
router.get('/chat/messages/:doctorId', patientController.getChatMessages);
router.post('/chat/messages', patientController.sendMessage);
router.post('/chat/mark-read/:doctorId', patientController.markMessagesRead);
router.get('/chat/unread-count', patientController.getUnreadCount);

// Payments
router.get('/payments', patientController.getPaymentHistory);
router.get('/payments/:id', patientController.getPaymentDetails);

module.exports = router;