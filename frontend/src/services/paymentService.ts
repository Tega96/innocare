// backend/src/services/paymentService.js
const crypto = require('crypto');
const axios = require('axios');
const { query } = require('../config/database');

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
      const { amount, email, phone, orderId, paymentType, appointmentId, orderDetails } = paymentData;
      
      // Generate transaction reference
      const transactionRef = this.generateTransactionReference();
      
      // Create payment record
      const payment = await query(
        `INSERT INTO payments 
         (user_id, appointment_id, order_id, amount, transaction_reference, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [paymentData.userId, appointmentId, orderId, amount, transactionRef]
      );
      
      // Prepare Interswitch payment payload
      const payload = {
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: 'NGN',
        customer: {
          email,
          phone,
          name: paymentData.customerName
        },
        metadata: {
          paymentType,
          orderId,
          appointmentId,
          transactionRef
        },
        redirect_url: `${this.returnUrl}?reference=${transactionRef}`,
        transaction_reference: transactionRef
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
          }
        }
      );
      
      // Update payment with Interswitch reference
      await query(
        'UPDATE payments SET interswitch_response = $1 WHERE id = $2',
        [response.data, payment.rows[0].id]
      );
      
      return {
        success: true,
        paymentUrl: response.data.data.authorization_url,
        transactionRef,
        paymentId: payment.rows[0].id
      };
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw new Error('Failed to initialize payment');
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
          }
        }
      );
      
      const paymentData = response.data.data;
      
      if (paymentData.status === 'success') {
        // Update payment record
        const payment = await query(
          `UPDATE payments 
           SET status = 'success', updated_at = NOW()
           WHERE transaction_reference = $1
           RETURNING *`,
          [transactionRef]
        );
        
        if (payment.rows.length > 0) {
          const payment = payment.rows[0];
          
          // Handle different payment types
          if (payment.appointment_id) {
            await this.handleAppointmentPayment(payment);
          } else if (payment.order_id) {
            await this.handleOrderPayment(payment);
          }
        }
        
        return { success: true, payment: payment.rows[0] };
      }
      
      return { success: false, message: 'Payment verification failed' };
      
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false, message: 'Failed to verify payment' };
    }
  }

  /**
   * Handle appointment payment success
   */
  async handleAppointmentPayment(payment) {
    // Update appointment payment status
    await query(
      `UPDATE appointments 
       SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
       WHERE id = $1`,
      [payment.appointment_id]
    );
    
    // Update doctor earnings (after platform fee deduction)
    const appointment = await query(
      'SELECT doctor_id, doctor_earnings FROM appointments WHERE id = $1',
      [payment.appointment_id]
    );
    
    if (appointment.rows.length > 0) {
      // Add to doctor's earnings (would be in a separate earnings table)
      await query(
        `INSERT INTO doctor_earnings (doctor_id, appointment_id, amount, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (appointment_id) DO UPDATE SET amount = EXCLUDED.amount`,
        [appointment.rows[0].doctor_id, payment.appointment_id, appointment.rows[0].doctor_earnings]
      );
    }
    
    // Send confirmation notifications
    await this.sendPaymentConfirmation(payment);
  }

  /**
   * Handle medication order payment success
   */
  async handleOrderPayment(payment) {
    // Update order payment status
    const order = await query(
      `UPDATE orders 
       SET payment_status = 'paid', status = 'processing', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [payment.order_id]
    );
    
    if (order.rows.length > 0) {
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
        
        // Record inventory transaction
        await query(
          `INSERT INTO inventory_transactions 
           (medication_id, transaction_type, quantity, reference_id)
           VALUES ($1, 'sale', $2, $3)`,
          [item.medication_id, -item.quantity, payment.order_id]
        );
      }
    }
    
    // Send order confirmation
    await this.sendOrderConfirmation(payment);
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
        'SELECT email, phone FROM users WHERE id = $1',
        [payment.user_id]
      );
      
      if (user.rows.length === 0) return;
      
      // Send email confirmation
      const emailService = require('./emailService');
      await emailService.sendPaymentConfirmation(user.rows[0].email, {
        amount: payment.amount,
        reference: payment.transaction_reference,
        date: new Date().toISOString(),
        type: payment.appointment_id ? 'Consultation' : 'Medication Order'
      });
      
    } catch (error) {
      console.error('Payment confirmation error:', error);
    }
  }

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(payment) {
    try {
      const order = await query(
        `SELECT o.*, u.email, u.phone 
         FROM orders o
         JOIN patients p ON o.patient_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE o.id = $1`,
        [payment.order_id]
      );
      
      if (order.rows.length === 0) return;
      
      const emailService = require('./emailService');
      await emailService.sendOrderConfirmation(order.rows[0].email, order.rows[0]);
      
    } catch (error) {
      console.error('Order confirmation error:', error);
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
          }
        }
      );
      
      if (response.data.status === 'success') {
        await query(
          `UPDATE payments 
           SET status = 'refunded', updated_at = NOW()
           WHERE id = $1`,
          [paymentId]
        );
        
        // Handle refund for appointment or order
        if (paymentData.appointment_id) {
          await query(
            `UPDATE appointments 
             SET payment_status = 'refunded', status = 'cancelled'
             WHERE id = $1`,
            [paymentData.appointment_id]
          );
        } else if (paymentData.order_id) {
          await query(
            `UPDATE orders 
             SET payment_status = 'refunded', status = 'cancelled'
             WHERE id = $1`,
            [paymentData.order_id]
          );
        }
        
        return { success: true };
      }
      
      return { success: false, message: 'Refund failed' };
      
    } catch (error) {
      console.error('Refund error:', error);
      return { success: false, message: error.message };
    }
  }
}

module.exports = new PaymentService();