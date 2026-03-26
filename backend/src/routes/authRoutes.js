// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

/**
 * Validation rules for registration
 */
const patientValidation = [
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[0-9+\-\s()]+$/),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('dateOfBirth').isISO8601()
];

const doctorValidation = [
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[0-9+\-\s()]+$/),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('specialization').notEmpty(),
  body('consultationFee').isNumeric(),
  body('hospitalName').notEmpty()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

/**
 * Authentication Routes
 */
router.post('/register/patient', patientValidation, validate, authController.registerPatient);
router.post('/register/doctor', doctorValidation, validate, authController.registerDoctor);
router.post('/login', loginValidation, validate, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-phone', authController.verifyPhone);
router.post('/resend-verification-email', authController.resendVerificationEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;