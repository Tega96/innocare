// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

// All routes require admin role
router.use(authenticateToken, authorizeRole('admin'));

// Dashboard stats
router.get('/stats', adminController.getStats);
router.get('/revenue-data', adminController.getRevenueData);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// Doctor management
router.get('/doctors', adminController.getDoctors);
router.get('/doctors/:id', adminController.getDoctorDetails);
router.put('/doctors/:id/verify', adminController.verifyDoctor);
router.put('/doctors/:id/toggle-status', adminController.toggleDoctorStatus);
router.delete('/doctors/:id', adminController.deleteDoctor);

// Appointment management
router.get('/appointments', adminController.getAppointments);
router.get('/appointments/:id', adminController.getAppointmentDetails);

// Reports
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/appointments', adminController.getAppointmentsReport);
router.get('/reports/users', adminController.getUsersReport);
router.get('/reports/pharmacy', adminController.getPharmacyReport);
router.get('/reports/export/:format', adminController.exportReport);

// Inventory management (pharmacy)
router.get('/medications', adminController.getMedications);
router.post('/medications', adminController.addMedication);
router.put('/medications/:id', adminController.updateMedication);
router.delete('/medications/:id', adminController.deleteMedication);
router.post('/inventory/adjust', adminController.adjustInventory);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;