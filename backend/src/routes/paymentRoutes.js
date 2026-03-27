// backend/src/routes/paymentRoutes.js (Updated)
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const interswitchRoutes = require('./interswitchRoutes');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const initializePaymentValidation = [
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₦100'),
  body('paymentType').isIn(['consultation', 'medication']).withMessage('Invalid payment type'),
  body('appointmentId').optional().isUUID(),
  body('orderId').optional().isUUID()
];

// Interswitch routes (public webhook endpoint)
router.use('/interswitch', interswitchRoutes);

// Webhook (legacy - for backward compatibility)
router.post('/webhook', paymentController.handleWebhook);

// Protected payment routes
router.use(authenticateToken);

router.post('/initialize', initializePaymentValidation, validate, paymentController.initializePayment);
router.get('/verify/:reference', paymentController.verifyPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/:id', paymentController.getPaymentDetails);
router.post('/:id/refund', paymentController.requestRefund);

module.exports = router;