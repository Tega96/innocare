// backend/src/services/paymentService.js
const crypto = require('crypto');
const axios = require('axios');
const { query } = require('../config/database');
const emailService = require('./emailService');
const smsService = require('./smsService');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.clientId = process.env.INTERSWITCH_CLIENT_ID;
    this.clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;
    this.environment = process.env.INTERSWITCH_ENVIRONMENT || 'sandbox';
    this.returnUrl = process.env.INTERSWITCH_RETURN_URL;
    
    // API endpoints
    this.apiUrl = this.environment === 'production'
      ? 'https://webpay.interswitchng.com'
      : 'https://sandbox.interswitchng.com';
  }

  /**
   * Initialize payment for consultation or medication
   */
  async initializePayment(paymentData) {
    try {
      const { amount, email, phone, orderId, paymentType, appointmentId, customerName, userId } = paymentData;
      
      // Generate transaction reference
      const transactionRef = this.generateTransactionReference();
      
      // Create payment record
      const payment = await query(
        `INSERT INTO payments 
         (id, user_id, appointment_id, order_id, amount, transaction_reference, status, payment_type)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', $6)
         RETURNING *`,
        [userId, appointmentId || null, orderId || null, amount, transactionRef, paymentType]
      );
      
      // Prepare Interswitch payment payload
      const payload = {
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: '566', // NGN currency code
        customer: {
          email,
          phone,
          name: customerName || 'MaternityCare Patient'
        },
        metadata: {
          paymentType,
          orderId,
          appointmentId,
          transactionRef,
          userId
        },
        redirect_url: `${this.returnUrl}?reference=${transactionRef}`,
        transaction_reference: transactionRef,
        payment_methods: ['card', 'transfer', 'ussd']
      };
      
      // Generate Interswitch signature
      const signature = this.generateSignature(payload);
      
      // Make request to Interswitch
      const response = await axios.post(
        `${this.apiUrl}/api/v1/payments/initialize`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.clientSecret}`,
            'Signature': signature,
            'Client-Id': this.clientId
          },
          timeout: 30000
        }
      );
      
      if (response.data && response.data.status === 'success') {
        // Update payment with Interswitch reference
        await query(
          `UPDATE payments 
           SET interswitch_response = $1, payment_url = $2, updated_at = NOW()
           WHERE id = $3`,
          [response.data, response.data.data.authorization_url, payment.rows[0].id]
        );
        
        logger.info(`Payment initialized: ${transactionRef} for user ${userId}`);
        
        return {
          success: true,
          paymentUrl: response.data.data.authorization_url,
          transactionRef,
          paymentId: payment.rows[0].id,
          amount: response.data.data.amount
        };
      }
      
      throw new Error('Payment initialization failed');
      
    } catch (error) {
      logger.error('Payment initialization error:', error);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  }

  /**
   * Verify payment after callback
   */
  async verifyPayment(transactionRef) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/api/v1/payments/verify/${transactionRef}`,
        {
          headers: {
            'Authorization': `Bearer ${this.clientSecret}`,
            'Client-Id': this.clientId
          },
          timeout: 30000
        }
      );
      
      const paymentData = response.data.data;
      
      if (paymentData.status === 'success') {
        // Update payment record
        const payment = await query(
          `UPDATE payments 
           SET status = 'success', 
               payment_method = $2,
               payment_details = $3,
               updated_at = NOW()
           WHERE transaction_reference = $1
           RETURNING *`,
          [transactionRef, paymentData.payment_method, paymentData]
        );
        
        if (payment.rows.length > 0) {
          const payment = payment.rows[0];
          
          // Handle different payment types
          if (payment.appointment_id) {
            await this.handleAppointmentPayment(payment);
          } else if (payment.order_id) {
            await this.handleOrderPayment(payment);
          }
          
          logger.info(`Payment verified: ${transactionRef} - Status: success`);
        }
        
        return { success: true, payment: payment.rows[0] };
      }
      
      // Update as failed
      await query(
        `UPDATE payments 
         SET status = 'failed', updated_at = NOW()
         WHERE transaction_reference = $1`,
        [transactionRef]
      );
      
      return { success: false, message: 'Payment verification failed' };
      
    } catch (error) {
      logger.error('Payment verification error:', error);
      return { success: false, message: 'Failed to verify payment' };
    }
  }

  /**
   * Handle appointment payment success
   */
  async handleAppointmentPayment(payment) {
    try {
      // Begin transaction
      await query('BEGIN');
      
      // Update appointment payment status
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
      
      // Update doctor earnings
      await query(
        `INSERT INTO doctor_earnings 
         (id, doctor_id, appointment_id, amount, platform_fee, net_amount, status, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'pending', NOW())`,
        [apt.doctor_id, payment.appointment_id, apt.consultation_fee, platformFee, doctorEarnings]
      );
      
      // Send confirmation notifications
      await this.sendPaymentConfirmation(payment);
      
      await query('COMMIT');
      
      logger.info(`Appointment payment processed: ${payment.appointment_id} - Amount: ${payment.amount}`);
      
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Handle appointment payment error:', error);
      throw error;
    }
  }

  /**
   * Handle medication order payment success
   */
  async handleOrderPayment(payment) {
    try {
      // Begin transaction
      await query('BEGIN');
      
      // Update order payment status
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
      
      const orderData = order.rows[0];
      
      // Update inventory
      const orderItems = await query(
        'SELECT medication_id, quantity FROM order_items WHERE order_id = $1',
        [payment.order_id]
      );
      
      for (const item of orderItems.rows) {
        // Update stock
        await query(
          `UPDATE medications 
           SET stock_quantity = stock_quantity - $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.medication_id]
        );
        
        // Record inventory transaction
        await query(
          `INSERT INTO inventory_transactions 
           (id, medication_id, transaction_type, quantity, reference_id, notes, created_at)
           VALUES (gen_random_uuid(), $1, 'sale', $2, $3, 'Order payment processed', NOW())`,
          [item.medication_id, -item.quantity, payment.order_id]
        );
      }
      
      // Send order confirmation
      await this.sendOrderConfirmation(payment);
      
      await query('COMMIT');
      
      logger.info(`Order payment processed: ${payment.order_id} - Amount: ${payment.amount}`);
      
    } catch (error) {
      await query('ROLLBACK');
      logger.error('Handle order payment error:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId, reason) {
    try {
      const payment = await query(
        'SELECT * FROM payments WHERE id = $1 AND status = $2',
        [paymentId, 'success']
      );
      
      if (payment.rows.length === 0) {
        throw new Error('Payment not found or not eligible for refund');
      }
      
      const paymentData = payment.rows[0];
      
      // Call Interswitch refund API
      const response = await axios.post(
        `${this.apiUrl}/api/v1/payments/refund`,
        {
          transaction_reference: paymentData.transaction_reference,
          amount: paymentData.amount,
          reason
        },
        {
          headers: {
            'Authorization': `Bearer ${this.clientSecret}`,
            'Client-Id': this.clientId
          },
          timeout: 30000
        }
      );
      
      if (response.data && response.data.status === 'success') {
        // Update payment status
        await query(
          `UPDATE payments 
           SET status = 'refunded', 
               refund_reason = $2,
               refund_date = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [paymentId, reason]
        );
        
        // Handle refund for appointment or order
        if (paymentData.appointment_id) {
          await query(
            `UPDATE appointments 
             SET payment_status = 'refunded', 
                 status = 'cancelled',
                 updated_at = NOW()
             WHERE id = $1`,
            [paymentData.appointment_id]
          );
        } else if (paymentData.order_id) {
          await query(
            `UPDATE orders 
             SET payment_status = 'refunded', 
                 status = 'cancelled',
                 updated_at = NOW()
             WHERE id = $1`,
            [paymentData.order_id]
          );
        }
        
        logger.info(`Refund processed: ${paymentData.transaction_reference} - Reason: ${reason}`);
        
        return { success: true };
      }
      
      return { success: false, message: 'Refund failed' };
      
    } catch (error) {
      logger.error('Refund error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate unique transaction reference
   */
  generateTransactionReference() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MAT-${timestamp}-${random}`;
  }

  /**
   * Generate Interswitch signature
   */
  generateSignature(payload) {
    const stringified = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(stringified)
      .digest('hex');
  }

  /**
   * Send payment confirmation email/SMS
   */
  async sendPaymentConfirmation(payment) {
    try {
      // Get user details
      const user = await query(
        `SELECT u.email, u.phone, p.first_name, p.last_name
         FROM users u
         JOIN patients p ON u.id = p.user_id
         WHERE u.id = $1`,
        [payment.user_id]
      );
      
      if (user.rows.length === 0) return;
      
      const userData = user.rows[0];
      const amount = payment.amount;
      const reference = payment.transaction_reference;
      const date = new Date().toISOString();
      const type = payment.appointment_id ? 'Consultation' : 'Medication Order';
      
      // Send email confirmation
      await emailService.sendPaymentConfirmation(userData.email, {
        name: `${userData.first_name} ${userData.last_name}`,
        amount,
        reference,
        date,
        type
      });
      
      // Send SMS confirmation
      await smsService.sendPaymentConfirmation(userData.phone, {
        amount,
        reference,
        type
      });
      
    } catch (error) {
      logger.error('Payment confirmation error:', error);
    }
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(payment) {
    try {
      const order = await query(
        `SELECT o.*, u.email, u.phone, p.first_name, p.last_name
         FROM orders o
         JOIN patients pat ON o.patient_id = pat.id
         JOIN users u ON pat.user_id = u.id
         WHERE o.id = $1`,
        [payment.order_id]
      );
      
      if (order.rows.length === 0) return;
      
      const orderData = order.rows[0];
      
      await emailService.sendOrderConfirmation(orderData.email, {
        orderNumber: orderData.id,
        amount: payment.amount,
        date: new Date().toISOString(),
        items: orderData.items,
        deliveryAddress: orderData.delivery_address
      });
      
    } catch (error) {
      logger.error('Order confirmation error:', error);
    }
  }

  /**
   * Get payment by reference
   */
  async getPaymentByReference(transactionRef) {
    const result = await query(
      'SELECT * FROM payments WHERE transaction_reference = $1',
      [transactionRef]
    );
    return result.rows[0];
  }

  /**
   * Get user payment history
   */
  async getUserPaymentHistory(userId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT p.*, 
              CASE 
                WHEN p.appointment_id IS NOT NULL THEN 'Consultation'
                WHEN p.order_id IS NOT NULL THEN 'Medication'
                ELSE 'Other'
              END as payment_type_name
       FROM payments p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    const count = await query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId]
    );
    
    return {
      payments: result.rows,
      total: parseInt(count.rows[0].count)
    };
  }
}

module.exports = new PaymentService();