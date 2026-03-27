// backend/src/routes/healthRoutes.js
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const healthRecordValidation = [
  body('blood_pressure_systolic').optional().isInt({ min: 70, max: 200 }),
  body('blood_pressure_diastolic').optional().isInt({ min: 40, max: 120 }),
  body('heart_rate').optional().isInt({ min: 40, max: 200 }),
  body('temperature').optional().isFloat({ min: 35, max: 42 }),
  body('weight_kg').optional().isFloat({ min: 30, max: 200 }),
  body('height_cm').optional().isFloat({ min: 100, max: 250 }),
  body('fundal_height_cm').optional().isInt({ min: 10, max: 50 }),
  body('fetal_heart_rate').optional().isInt({ min: 60, max: 200 }),
  body('fetal_movements_per_day').optional().isInt({ min: 0, max: 100 }),
  body('symptoms').optional().isObject(),
  body('notes').optional().isString()
];

// Patient routes
router.use(authenticateToken);

router.get('/records', healthController.getHealthRecords);
router.post('/records', healthRecordValidation, validate, healthController.addHealthRecord);
router.get('/records/:id', healthController.getHealthRecord);
router.delete('/records/:id', healthController.deleteHealthRecord);
router.get('/trends', healthController.getHealthTrends);
router.get('/summary', healthController.getHealthSummary);

// Doctor routes for patient monitoring
router.get('/patient/:patientId', authorizeRole('doctor'), healthController.getPatientHealthRecords);
router.get('/patient/:patientId/summary', authorizeRole('doctor'), healthController.getPatientHealthSummary);
router.get('/patient/:patientId/trends', authorizeRole('doctor'), healthController.getPatientHealthTrends);

module.exports = router;