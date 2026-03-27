// backend/src/services/interswitchWebhook.js
const interswitchConfig = require('../config/interswitch');
const { query } = require('../config/database');
const paymentService = require('./paymentService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class InterswitchWebhookHandler {
  constructor() {
    this.webhookSecret = process.env.INTERSWITCH_WEBHOOK_SECRET;
  }

  /**
   * Handle incoming webhook from Interswitch
   */
  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-interswitch-signature'];
      const payload = req.body;

      // Verify webhook signature
      if (!interswitchConfig.verifyWebhookSignature(payload, signature)) {
        logger.warn('Invalid webhook signature received');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Parse webhook payload
      const webhookData = interswitchConfig.parseWebhookPayload(payload);
      
      if (!webhookData) {
        logger.warn('Invalid webhook payload received');
        return res.status(400).json({ error: 'Invalid payload' });
      }

      logger.info(`Webhook received: ${webhookData.event} - ${webhookData.transactionRef}`);

      // Handle different webhook events
      switch (webhookData.event) {
        case 'payment.success':
          await this.handlePaymentSuccess(webhookData);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(webhookData);
          break;
        case 'payment.pending':
          await this.handlePaymentPending(webhookData);
          break;
        case 'refund.success':
          await this.handleRefundSuccess(webhookData);
          break;
        case 'refund.failed':
          await this.handleRefundFailed(webhookData);
          break;
        default:
          logger.info(`Unhandled webhook event: ${webhookData.event}`);
      }

      // Always return 200 to acknowledge receipt
      res.json({ received: true });

    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(data) {
    try {
      const { transactionRef, amount, paymentMethod, customer, metadata } = data;

      // Update payment record in database
      const payment = await query(
        `UPDATE payments 
         SET status = 'success', 
             payment_method = $2,
             payment_details = $3,
             paid_at = NOW(),
             updated_at = NOW()
         WHERE transaction_reference = $1
         RETURNING *`,
        [transactionRef, paymentMethod, { customer, metadata }]
      );

      if (payment.rows.length === 0) {
        logger.warn(`Payment not found for reference: ${transactionRef}`);
        return;
      }

      const paymentRecord = payment.rows[0];

      // Handle different payment types
      if (paymentRecord.appointment_id) {
        await this.handleAppointmentPayment(paymentRecord);
      } else if (paymentRecord.order_id) {
        await this.handleOrderPayment(paymentRecord);
      }

      // Send confirmation email
      await this.sendPaymentConfirmation(paymentRecord);

      logger.info(`Payment success processed: ${transactionRef}`);

    } catch (error) {
      logger.error('Handle payment success error:', error);
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(data) {
    try {
      const { transactionRef, status, message } = data;

      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'failed', 
             failure_reason = $2,
             updated_at = NOW()
         WHERE transaction_reference = $1`,
        [transactionRef, message]
      );

      logger.info(`Payment failed: ${transactionRef} - ${message}`);

    } catch (error) {
      logger.error('Handle payment failed error:', error);
    }
  }

  /**
   * Handle pending payment
   */
  async handlePaymentPending(data) {
    try {
      const { transactionRef, status, message } = data;

      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'pending',
             pending_reason = $2,
             updated_at = NOW()
         WHERE transaction_reference = $1`,
        [transactionRef, message]
      );

      logger.info(`Payment pending: ${transactionRef}`);

    } catch (error) {
      logger.error('Handle payment pending error:', error);
    }
  }

  /**
   * Handle successful refund
   */
  async handleRefundSuccess(data) {
    try {
      const { transactionRef, refundReference, amount } = data;

      // Update payment record
      await query(
        `UPDATE payments 
         SET status = 'refunded',
             refund_reference = $2,
             refund_amount = $3,
             refunded_at = NOW(),
             updated_at = NOW()
         WHERE transaction_reference = $1`,
        [transactionRef, refundReference, amount]
      );

      logger.info(`Refund successful: ${transactionRef}`);

    } catch (error) {
      logger.error('Handle refund success error:', error);
    }
  }

  /**
   * Handle failed refund
   */
  async handleRefundFailed(data) {
    try {
      const { transactionRef, message } = data;

      await query(
        `UPDATE payments 
         SET refund_failed_reason = $2,
             updated_at = NOW()
         WHERE transaction_reference = $1`,
        [transactionRef, message]
      );

      logger.info(`Refund failed: ${transactionRef} - ${message}`);

    } catch (error) {
      logger.error('Handle refund failed error:', error);
    }
  }

  /**
   * Handle appointment payment
   */
  async handleAppointmentPayment(payment) {
    try {
      await query('BEGIN');

      // Update appointment
      const appointment = await query(
        `UPDATE appointments 
         SET payment_status = 'paid', 
             status = 'confirmed',
             updated_at = NOW()
         WHERE id = $1
         RETURNING doctor_id, patient_id, consultation_fee`,
        [payment.appointment_id]
      );

      if (appointment.rows.length === 0) {
        throw new Error('Appointment not found');
      }

      const apt = appointment.rows[0];
      const platformFee = apt.consultation_fee * 0.10;
      const doctorEarnings = apt.consultation_fee - platformFee;

      // Record doctor earnings
      await query(
        `INSERT INTO doctor_earnings 
         (doctor_id, appointment_id, amount, platform_fee, net_amount, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [apt.doctor_id, payment.appointment_id, apt.consultation_fee, platformFee, doctorEarnings]
      );

      await query('COMMIT');

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Handle order payment
   */
  async handleOrderPayment(payment) {
    try {
      await query('BEGIN');

      // Update order
      const order = await query(
        `UPDATE orders 
         SET payment_status = 'paid', 
             status = 'processing',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [payment.order_id]
      );

      if (order.rows.length === 0) {
        throw new Error('Order not found');
      }

      // Update inventory
      const orderItems = await query(
        'SELECT medication_id, quantity FROM order_items WHERE order_id = $1',
        [payment.order_id]
      );

      for (const item of orderItems.rows) {
        await query(
          `UPDATE medications 
           SET stock_quantity = stock_quantity - $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.medication_id]
        );

        await query(
          `INSERT INTO inventory_transactions 
           (medication_id, transaction_type, quantity, reference_id)
           VALUES ($1, 'sale', $2, $3)`,
          [item.medication_id, -item.quantity, payment.order_id]
        );
      }

      await query('COMMIT');

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(payment) {
    try {
      const user = await query(
        `SELECT u.email, u.phone, 
                COALESCE(p.first_name, d.first_name) as first_name,
                COALESCE(p.last_name, d.last_name) as last_name
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         WHERE u.id = $1`,
        [payment.user_id]
      );

      if (user.rows.length === 0) return;

      const userData = user.rows[0];
      const paymentType = payment.appointment_id ? 'Consultation' : 'Medication Order';

      await emailService.sendPaymentConfirmation(userData.email, {
        name: `${userData.first_name} ${userData.last_name}`,
        amount: payment.amount,
        reference: payment.transaction_reference,
        date: new Date().toISOString(),
        type: paymentType
      });

    } catch (error) {
      logger.error('Send payment confirmation error:', error);
    }
  }
}

module.exports = new InterswitchWebhookHandler();