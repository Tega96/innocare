// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validate = require('../middleware/validation');
const { authenticateToken } = require ('../middleware/auth');

/**
 * Validation rules for registration
 */
const patientValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').matches(/^[0-9+\-\s()]+$/).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required')
];

const doctorValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').matches(/^[0-9+\-\s()]+$/).withMessage('Valid phone number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('consultationFee').isNumeric().withMessage('Consultation fee must be a number'),
  body('hospitalName').notEmpty().withMessage('Hospital name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

/**
 * Authentication Routes
 */
router.post('/register/patient', patientValidation, validate, authController.registerPatient);
router.post('/register/doctor', doctorValidation, validate, authController.registerDoctor);
router.post('/login', loginValidation, validate, authController.login);
router.post('/me', authenticateToken, authController.getMe);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/verify-phone', authController.verifyPhone);
router.post('/resend-verification-email', authController.resendVerificationEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;