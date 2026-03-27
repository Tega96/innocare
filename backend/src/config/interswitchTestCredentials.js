// backend/src/config/interswitchTestCredentials.js
// Test credentials for Interswitch sandbox environment

const testCredentials = {
  // Test cards for sandbox environment
  cards: {
    mastercard: {
      number: '5123450000000008',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      pin: '1234'
    },
    visa: {
      number: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      pin: '1234'
    },
    verve: {
      number: '5061111111111111',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      pin: '1234'
    }
  },
  
  // Test USSD codes
  ussd: {
    gtbank: '*737*',
    uba: '*919*',
    access: '*901*',
    firstbank: '*894*'
  },
  
  // Test bank accounts for transfer
  bankAccounts: {
    gtbank: {
      bankCode: '058',
      accountNumber: '0123456789',
      accountName: 'John Doe'
    },
    uba: {
      bankCode: '033',
      accountNumber: '0123456789',
      accountName: 'John Doe'
    }
  },
  
  // Test responses
  responses: {
    success: {
      code: '00',
      message: 'Successful',
      description: 'Transaction successful'
    },
    insufficientFunds: {
      code: '51',
      message: 'Insufficient funds',
      description: 'Insufficient balance'
    },
    invalidCard: {
      code: '14',
      message: 'Invalid card',
      description: 'Card details are invalid'
    },
    declined: {
      code: '05',
      message: 'Declined',
      description: 'Transaction declined'
    }
  }
};

module.exports = testCredentials;