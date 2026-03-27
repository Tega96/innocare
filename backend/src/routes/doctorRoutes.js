// backend/src/routes/doctorRoutes.js
const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// All routes require authentication and doctor role
router.use(authenticateToken, authorizeRole('doctor'));

// Profile routes
router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.updateProfile);
router.post('/profile/image', doctorController.uploadProfileImage);

// Patient management
router.get('/patients', doctorController.getPatients);
router.get('/patients/:patientId', doctorController.getPatientDetails);
router.get('/patients/:patientId/health-records', doctorController.getPatientHealthRecords);
router.get('/patients/:patientId/medical-records', doctorController.getPatientMedicalRecords);

// Appointments
router.get('/appointments', doctorController.getAppointments);
router.get('/appointments/:id', doctorController.getAppointmentDetails);
router.put('/appointments/:id/status', doctorController.updateAppointmentStatus);
router.post('/appointments/:id/notes', doctorController.addAppointmentNotes);
router.post('/appointments/:id/prescription', doctorController.createPrescription);

// Prescriptions
router.get('/prescriptions', doctorController.getPrescriptions);
router.get('/prescriptions/:id', doctorController.getPrescriptionDetails);
router.put('/prescriptions/:id', doctorController.updatePrescription);

// Earnings
router.get('/earnings', doctorController.getEarnings);
router.get('/earnings/summary', doctorController.getEarningsSummary);
router.get('/transactions', doctorController.getTransactions);
router.post('/withdraw', doctorController.requestWithdrawal);
router.get('/withdrawals', doctorController.getWithdrawals);
router.get('/bank-details', doctorController.getBankDetails);
router.post('/bank-details', doctorController.saveBankDetails);

// Availability
router.get('/availability', doctorController.getAvailability);
router.put('/availability', doctorController.updateAvailability);

// Chat
router.get('/chat/patients', doctorController.getChatPatients);
router.get('/chat/messages/:patientId', doctorController.getChatMessages);
router.post('/chat/messages', doctorController.sendMessage);
router.post('/chat/mark-read/:patientId', doctorController.markMessagesRead);
router.get('/chat/unread-count', doctorController.getUnreadCount);

// Statistics
router.get('/statistics', doctorController.getStatistics);
router.get('/appointment-trends', doctorController.getAppointmentTrends);

module.exports = router;