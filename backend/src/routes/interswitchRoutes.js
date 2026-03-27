// backend/src/routes/interswitchRoutes.js
const express = require('express');
const router = express.Router();
const interswitchConfig = require('../config/interswitch');
const interswitchWebhook = require('../services/interswitchWebhook');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Webhook endpoint for Interswitch callbacks
 * POST /api/interswitch/webhook
 */
router.post('/webhook', interswitchWebhook.handleWebhook.bind(interswitchWebhook));

/**
 * Payment return URL (after payment)
 * GET /api/interswitch/return
 */
router.get('/return', async (req, res) => {
  try {
    const { reference, status, transaction_reference } = req.query;
    
    if (status === 'success' && (reference || transaction_reference)) {
      const txRef = reference || transaction_reference;
      
      // Verify payment
      const verification = await interswitchConfig.verifyPayment(txRef);
      
      if (verification.success && verification.status === 'success') {
        // Redirect to success page
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${txRef}`);
      }
    }
    
    // Redirect to failure page
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure?reference=${transaction_reference || reference}`);
    
  } catch (error) {
    logger.error('Payment return error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  }
});

/**
 * Get payment methods
 * GET /api/interswitch/payment-methods
 */
router.get('/payment-methods', (req, res) => {
  res.json({
    methods: interswitchConfig.getPaymentMethods(),
    currency: interswitchConfig.getCurrency()
  });
});

/**
 * Get transaction fee (authenticated)
 * POST /api/interswitch/fee
 */
router.post('/fee', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    
    const feeInfo = await interswitchConfig.getTransactionFee(amount, paymentMethod);
    
    res.json(feeInfo);
    
  } catch (error) {
    logger.error('Get transaction fee error:', error);
    res.status(500).json({ error: 'Failed to get transaction fee' });
  }
});

/**
 * Get supported banks (for transfers)
 * GET /api/interswitch/banks
 */
router.get('/banks', authenticateToken, async (req, res) => {
  try {
    const banks = await interswitchConfig.getSupportedBanks();
    res.json(banks);
    
  } catch (error) {
    logger.error('Get banks error:', error);
    res.status(500).json({ error: 'Failed to get banks' });
  }
});

/**
 * Verify bank account (for transfers)
 * POST /api/interswitch/verify-account
 */
router.post('/verify-account', authenticateToken, async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    
    const verification = await interswitchConfig.verifyBankAccount(accountNumber, bankCode);
    
    res.json(verification);
    
  } catch (error) {
    logger.error('Verify account error:', error);
    res.status(500).json({ error: 'Failed to verify account' });
  }
});

/**
 * Get transaction status
 * GET /api/interswitch/transaction/:reference
 */
router.get('/transaction/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;
    
    const status = await interswitchConfig.getTransactionStatus(reference);
    
    res.json(status);
    
  } catch (error) {
    logger.error('Get transaction status error:', error);
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
});

/**
 * Health check
 * GET /api/interswitch/health
 */
router.get('/health', async (req, res) => {
  const health = await interswitchConfig.healthCheck();
  res.json(health);
});

/**
 * Admin: Refund transaction
 * POST /api/interswitch/refund
 */
router.post('/refund', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { transactionRef, amount, reason } = req.body;
    
    const refund = await interswitchConfig.processRefund(transactionRef, amount, reason);
    
    res.json(refund);
    
  } catch (error) {
    logger.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

/**
 * Generate payment URL (for API integrations)
 * POST /api/interswitch/payment-url
 */
router.post('/payment-url', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethods, metadata } = req.body;
    
    // Get user details
    const user = await query(
      `SELECT u.email, u.phone, 
              COALESCE(p.first_name, d.first_name) as first_name,
              COALESCE(p.last_name, d.last_name) as last_name
       FROM users u
       LEFT JOIN patients p ON u.id = p.user_id
       LEFT JOIN doctors d ON u.id = d.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = user.rows[0];
    
    const paymentUrl = interswitchConfig.generatePaymentUrl({
      amount,
      customerEmail: userData.email,
      customerPhone: userData.phone,
      customerName: `${userData.first_name} ${userData.last_name}`,
      paymentMethods,
      metadata: {
        ...metadata,
        userId: req.user.id
      }
    });
    
    res.json({ paymentUrl });
    
  } catch (error) {
    logger.error('Generate payment URL error:', error);
    res.status(500).json({ error: 'Failed to generate payment URL' });
  }
});

module.exports = router;