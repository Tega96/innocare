// backend/src/config/interswitch.js
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

class InterswitchConfig {
  constructor() {
    this.clientId = process.env.INTERSWITCH_CLIENT_ID;
    this.clientSecret = process.env.INTERSWITCH_CLIENT_SECRET;
    this.environment = process.env.INTERSWITCH_ENVIRONMENT || 'sandbox';
    this.returnUrl = process.env.INTERSWITCH_RETURN_URL;
    this.webhookSecret = process.env.INTERSWITCH_WEBHOOK_SECRET;
    
    // API Endpoints based on environment
    this.apiUrls = {
      sandbox: {
        base: 'https://sandbox.interswitchng.com',
        webpay: 'https://sandbox.interswitchng.com/webpay',
        api: 'https://sandbox.interswitchng.com/api/v1',
        paydirect: 'https://sandbox.interswitchng.com/paydirect'
      },
      production: {
        base: 'https://webpay.interswitchng.com',
        webpay: 'https://webpay.interswitchng.com',
        api: 'https://api.interswitchng.com/api/v1',
        paydirect: 'https://paydirect.interswitchng.com'
      }
    };
    
    this.apiUrl = this.apiUrls[this.environment] || this.apiUrls.sandbox;
    
    // Payment methods configuration
    this.paymentMethods = {
      card: {
        enabled: true,
        name: 'Card Payment',
        icon: 'credit-card'
      },
      transfer: {
        enabled: true,
        name: 'Bank Transfer',
        icon: 'bank'
      },
      ussd: {
        enabled: true,
        name: 'USSD',
        icon: 'phone'
      },
      qr: {
        enabled: false,
        name: 'QR Code',
        icon: 'qrcode'
      }
    };
    
    // Currency configuration
    this.currency = {
      code: '566', // NGN currency code
      symbol: '₦',
      name: 'Nigerian Naira'
    };
  }

  /**
   * Generate transaction reference
   */
  generateTransactionReference(prefix = 'MAT') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
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
   * Generate MAC (Message Authentication Code)
   */
  generateMAC(transactionRef, amount, customerId) {
    const hashString = `${transactionRef}|${amount}|${this.clientId}|${customerId}`;
    return crypto
      .createHmac('sha512', this.clientSecret)
      .update(hashString)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Initialize payment
   */
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        customerEmail,
        customerPhone,
        customerName,
        transactionRef,
        paymentMethods = ['card', 'transfer', 'ussd'],
        metadata = {}
      } = paymentData;

      // Generate transaction reference if not provided
      const txRef = transactionRef || this.generateTransactionReference();

      // Calculate amount in kobo/cents (Interswitch expects amount in smallest currency unit)
      const amountInKobo = Math.round(amount * 100);

      // Generate MAC
      const mac = this.generateMAC(txRef, amountInKobo, customerEmail);

      // Prepare payload for Interswitch WebPay
      const payload = {
        amount: amountInKobo,
        currency: this.currency.code,
        customer: {
          email: customerEmail,
          phone: customerPhone,
          name: customerName
        },
        metadata: {
          ...metadata,
          transaction_ref: txRef,
          timestamp: new Date().toISOString()
        },
        redirect_url: this.returnUrl,
        transaction_reference: txRef,
        payment_methods: paymentMethods,
        site_redirect_url: this.returnUrl
      };

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'MAC': mac,
        'Signature': this.generateSignature(payload),
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      logger.info(`Initializing payment: ${txRef} - Amount: ${amount}`);

      // Make request to Interswitch
      const response = await axios.post(
        `${this.apiUrl.webpay}/api/v1/pay`,
        payload,
        { headers, timeout: 30000 }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          paymentUrl: response.data.data.authorization_url,
          transactionRef: txRef,
          reference: response.data.data.reference,
          amount: amount
        };
      }

      throw new Error(response.data.message || 'Payment initialization failed');

    } catch (error) {
      logger.error('Interswitch payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Payment initialization failed'
      };
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(transactionRef) {
    try {
      // Generate MAC for verification
      const mac = this.generateMAC(transactionRef, '', '');

      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'MAC': mac,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      logger.info(`Verifying payment: ${transactionRef}`);

      const response = await axios.get(
        `${this.apiUrl.api}/transactions/${transactionRef}`,
        { headers, timeout: 30000 }
      );

      if (response.data && response.data.status === '00') {
        const transaction = response.data.data;

        return {
          success: true,
          status: transaction.status,
          amount: transaction.amount / 100, // Convert from kobo
          reference: transaction.reference,
          paymentMethod: transaction.payment_method,
          customer: transaction.customer,
          metadata: transaction.metadata,
          paidAt: transaction.paid_at,
          transactionRef
        };
      }

      return {
        success: false,
        status: 'failed',
        message: response.data?.message || 'Payment verification failed'
      };

    } catch (error) {
      logger.error('Interswitch payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(transactionRef, amount, reason) {
    try {
      const amountInKobo = Math.round(amount * 100);
      const refundRef = this.generateTransactionReference('REF');

      const mac = this.generateMAC(transactionRef, amountInKobo, '');

      const payload = {
        transaction_reference: transactionRef,
        amount: amountInKobo,
        refund_reference: refundRef,
        reason: reason
      };

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'MAC': mac,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      logger.info(`Processing refund: ${transactionRef} - Amount: ${amount}`);

      const response = await axios.post(
        `${this.apiUrl.api}/transactions/refund`,
        payload,
        { headers, timeout: 30000 }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          refundReference: refundRef,
          amount: amount,
          status: response.data.data.status
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Refund processing failed'
      };

    } catch (error) {
      logger.error('Interswitch refund error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Refund processing failed'
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionRef) {
    try {
      const mac = this.generateMAC(transactionRef, '', '');

      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'MAC': mac,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      const response = await axios.get(
        `${this.apiUrl.api}/transactions/${transactionRef}/status`,
        { headers, timeout: 30000 }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          status: response.data.data.status,
          transaction: response.data.data
        };
      }

      return {
        success: false,
        status: 'unknown',
        message: response.data?.message || 'Unable to fetch transaction status'
      };

    } catch (error) {
      logger.error('Get transaction status error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get transaction status'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      logger.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(body) {
    try {
      const payload = typeof body === 'string' ? JSON.parse(body) : body;
      
      return {
        event: payload.event,
        transactionRef: payload.data?.transaction_reference,
        status: payload.data?.status,
        amount: payload.data?.amount ? payload.data.amount / 100 : null,
        paymentMethod: payload.data?.payment_method,
        customer: payload.data?.customer,
        metadata: payload.data?.metadata,
        timestamp: payload.timestamp
      };
    } catch (error) {
      logger.error('Parse webhook payload error:', error);
      return null;
    }
  }

  /**
   * Get supported banks for transfer
   */
  async getSupportedBanks() {
    try {
      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      const response = await axios.get(
        `${this.apiUrl.api}/banks`,
        { headers, timeout: 30000 }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          banks: response.data.data
        };
      }

      return {
        success: false,
        banks: []
      };

    } catch (error) {
      logger.error('Get supported banks error:', error);
      return {
        success: false,
        banks: []
      };
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      const response = await axios.get(
        `${this.apiUrl.api}/banks/verify`,
        {
          params: { account_number: accountNumber, bank_code: bankCode },
          headers,
          timeout: 30000
        }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          accountName: response.data.data.account_name,
          accountNumber: response.data.data.account_number
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Account verification failed'
      };

    } catch (error) {
      logger.error('Verify bank account error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify account'
      };
    }
  }

  /**
   * Get transaction fee
   */
  async getTransactionFee(amount, paymentMethod = 'card') {
    try {
      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      const response = await axios.get(
        `${this.apiUrl.api}/fees`,
        {
          params: { amount: Math.round(amount * 100), payment_method: paymentMethod },
          headers,
          timeout: 30000
        }
      );

      if (response.data && response.data.status === '00') {
        return {
          success: true,
          fee: response.data.data.fee / 100,
          totalAmount: (amount + (response.data.data.fee / 100)),
          merchantFee: response.data.data.merchant_fee / 100
        };
      }

      return {
        success: true,
        fee: 0,
        totalAmount: amount,
        merchantFee: 0
      };

    } catch (error) {
      logger.error('Get transaction fee error:', error.message);
      return {
        success: true,
        fee: 0,
        totalAmount: amount,
        merchantFee: 0
      };
    }
  }

  /**
   * Generate payment button HTML (for frontend integration)
   */
  generatePaymentButton(paymentData) {
    const {
      amount,
      customerEmail,
      customerPhone,
      customerName,
      transactionRef,
      paymentMethods = ['card', 'transfer', 'ussd'],
      buttonText = 'Pay Now',
      buttonClass = 'btn-primary',
      redirectUrl = this.returnUrl
    } = paymentData;

    const txRef = transactionRef || this.generateTransactionReference();
    const amountInKobo = Math.round(amount * 100);
    const mac = this.generateMAC(txRef, amountInKobo, customerEmail);

    return `
      <form method="POST" action="${this.apiUrl.webpay}/api/v1/pay" id="interswitch-payment-form">
        <input type="hidden" name="amount" value="${amountInKobo}">
        <input type="hidden" name="currency" value="${this.currency.code}">
        <input type="hidden" name="customer_email" value="${customerEmail}">
        <input type="hidden" name="customer_phone" value="${customerPhone}">
        <input type="hidden" name="customer_name" value="${customerName}">
        <input type="hidden" name="transaction_reference" value="${txRef}">
        <input type="hidden" name="redirect_url" value="${redirectUrl}">
        <input type="hidden" name="payment_methods" value="${paymentMethods.join(',')}">
        <input type="hidden" name="mac" value="${mac}">
        <button type="submit" class="${buttonClass}">${buttonText}</button>
      </form>
      <script>
        document.getElementById('interswitch-payment-form').submit();
      </script>
    `;
  }

  /**
   * Generate direct payment URL (for API responses)
   */
  generatePaymentUrl(paymentData) {
    const {
      amount,
      customerEmail,
      customerPhone,
      customerName,
      transactionRef,
      paymentMethods = ['card', 'transfer', 'ussd'],
      redirectUrl = this.returnUrl
    } = paymentData;

    const txRef = transactionRef || this.generateTransactionReference();
    const amountInKobo = Math.round(amount * 100);
    const mac = this.generateMAC(txRef, amountInKobo, customerEmail);

    const params = new URLSearchParams({
      amount: amountInKobo,
      currency: this.currency.code,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_name: customerName,
      transaction_reference: txRef,
      redirect_url: redirectUrl,
      payment_methods: paymentMethods.join(','),
      mac: mac
    });

    return `${this.apiUrl.webpay}/api/v1/pay?${params.toString()}`;
  }

  /**
   * Health check - test Interswitch connection
   */
  async healthCheck() {
    try {
      const testRef = this.generateTransactionReference('TEST');
      const headers = {
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Client-Id': this.clientId,
        'Timestamp': Date.now().toString()
      };

      await axios.get(`${this.apiUrl.api}/health`, { headers, timeout: 10000 });
      
      return {
        success: true,
        environment: this.environment,
        message: 'Interswitch connection successful'
      };
    } catch (error) {
      logger.error('Interswitch health check failed:', error.message);
      return {
        success: false,
        environment: this.environment,
        message: 'Interswitch connection failed',
        error: error.message
      };
    }
  }

  /**
   * Get payment methods configuration
   */
  getPaymentMethods() {
    const enabledMethods = {};
    Object.entries(this.paymentMethods).forEach(([key, method]) => {
      if (method.enabled) {
        enabledMethods[key] = method;
      }
    });
    return enabledMethods;
  }

  /**
   * Get currency configuration
   */
  getCurrency() {
    return this.currency;
  }

  /**
   * Get environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Validate Interswitch configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.clientId) {
      errors.push('INTERSWITCH_CLIENT_ID is not configured');
    }
    
    if (!this.clientSecret) {
      errors.push('INTERSWITCH_CLIENT_SECRET is not configured');
    }
    
    if (!this.returnUrl) {
      errors.push('INTERSWITCH_RETURN_URL is not configured');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create and export singleton instance
const interswitchConfig = new InterswitchConfig();

// Validate configuration on startup
const validation = interswitchConfig.validateConfig();
if (!validation.valid) {
  logger.warn('Interswitch configuration validation failed:', validation.errors);
} else {
  logger.info(`Interswitch configuration validated successfully (${interswitchConfig.getEnvironment()} environment)`);
}

module.exports = interswitchConfig;