// backend/src/controllers/paymentController.js
const paymentService = require('../services/paymentService');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Initialize payment
   * POST /api/payments/initialize
   */
  async initializePayment(req, res) {
    try {
      const { amount, paymentType, appointmentId, orderId } = req.body;
      const userId = req.user.id;
      
      // Get user details
      const userResult = await query(
        `SELECT u.email, u.phone, 
                COALESCE(p.first_name, d.first_name) as first_name,
                COALESCE(p.last_name, d.last_name) as last_name
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      const result = await paymentService.initializePayment({
        amount,
        email: user.email,
        phone: user.phone,
        userId,
        paymentType,
        appointmentId,
        orderId,
        customerName: `${user.first_name} ${user.last_name}`
      });
      
      if (result.success) {
        res.json({
          success: true,
          paymentUrl: result.paymentUrl,
          transactionRef: result.transactionRef,
          paymentId: result.paymentId
        });
      } else {
        res.status(400).json({ error: result.error || 'Payment initialization failed' });
      }
      
    } catch (error) {
      logger.error('Initialize payment error:', error);
      res.status(500).json({ error: 'Failed to initialize payment' });
    }
  }

  /**
   * Verify payment
   * GET /api/payments/verify/:reference
   */
  async verifyPayment(req, res) {
    try {
      const { reference } = req.params;
      
      const result = await paymentService.verifyPayment(reference);
      
      if (result.success) {
        res.json({
          success: true,
          payment: result.payment,
          message: 'Payment verified successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message || 'Payment verification failed'
        });
      }
      
    } catch (error) {
      logger.error('Verify payment error:', error);
      res.status(500).json({ error: 'Failed to verify payment' });
    }
  }

  /**
   * Handle Interswitch webhook
   * POST /api/payments/webhook
   */
  async handleWebhook(req, res) {
    try {
      const { event, data } = req.body;
      
      // Verify webhook signature
      const signature = req.headers['x-interswitch-signature'];
      // TODO: Verify signature with Interswitch public key
      
      if (event === 'payment.success') {
        const { transaction_reference } = data;
        await paymentService.verifyPayment(transaction_reference);
      }
      
      // Always return 200 to acknowledge receipt
      res.json({ received: true });
      
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Get user payment history
   * GET /api/payments/history
   */
  async getPaymentHistory(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user.id;
      
      const result = await paymentService.getUserPaymentHistory(userId, limit, offset);
      
      res.json(result);
      
    } catch (error) {
      logger.error('Get payment history error:', error);
      res.status(500).json({ error: 'Failed to get payment history' });
    }
  }

  /**
   * Get payment details
   * GET /api/payments/:id
   */
  async getPaymentDetails(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await query(
        `SELECT p.*, 
                CASE 
                  WHEN p.appointment_id IS NOT NULL THEN 'Consultation'
                  WHEN p.order_id IS NOT NULL THEN 'Medication'
                  ELSE 'Other'
                END as payment_type_name
         FROM payments p
         WHERE p.id = $1 AND p.user_id = $2`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get payment details error:', error);
      res.status(500).json({ error: 'Failed to get payment details' });
    }
  }

  /**
   * Request refund
   * POST /api/payments/:id/refund
   */
  async requestRefund(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      
      // Verify payment belongs to user
      const payment = await query(
        'SELECT * FROM payments WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (payment.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      const result = await paymentService.processRefund(id, reason);
      
      if (result.success) {
        res.json({ success: true, message: 'Refund requested successfully' });
      } else {
        res.status(400).json({ error: result.message || 'Refund failed' });
      }
      
    } catch (error) {
      logger.error('Request refund error:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }
}

module.exports = new PaymentController();