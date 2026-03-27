// backend/src/utils/constants.js
module.exports = {
  // User Roles
  USER_ROLES: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    ADMIN: 'admin'
  },
  
  // Appointment Status
  APPOINTMENT_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show'
  },
  
  // Appointment Types
  APPOINTMENT_TYPES: {
    VIDEO: 'video',
    IN_PERSON: 'in_person'
  },
  
  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },
  
  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  },
  
  // Prescription Status
  PRESCRIPTION_STATUS: {
    ACTIVE: 'active',
    DISPENSED: 'dispensed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  },
  
  // Notification Types
  NOTIFICATION_TYPES: {
    APPOINTMENT: 'appointment',
    PAYMENT: 'payment',
    PRESCRIPTION: 'prescription',
    ORDER: 'order',
    SYSTEM: 'system'
  },
  
  // Medication Categories
  MEDICATION_CATEGORIES: {
    VITAMINS: 'Vitamins',
    MINERALS: 'Minerals',
    PAIN_RELIEF: 'Pain Relief',
    DIGESTIVE: 'Digestive',
    ANTIBIOTICS: 'Antibiotics',
    ANTIMALARIAL: 'Antimalarial',
    PRESCRIPTION: 'Prescription'
  },
  
  // Medical Record Types
  MEDICAL_RECORD_TYPES: {
    MEDICAL_REPORT: 'medical_report',
    PRESCRIPTION: 'prescription',
    LAB_RESULT: 'lab_result',
    IMAGING: 'imaging',
    VACCINATION: 'vaccination'
  },
  
  // Symptoms
  SYMPTOMS: [
    'nausea',
    'headache',
    'fatigue',
    'swelling',
    'cramps',
    'back_pain',
    'dizziness',
    'heartburn',
    'constipation',
    'insomnia',
    'anxiety',
    'contractions'
  ],
  
  // Severity Levels
  SEVERITY_LEVELS: {
    NONE: 'none',
    MILD: 'mild',
    MODERATE: 'moderate',
    SEVERE: 'severe'
  },
  
  // Days of Week
  DAYS_OF_WEEK: [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ],
  
  // Blood Groups
  BLOOD_GROUPS: [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-'
  ],
  
  // Genotypes
  GENOTYPES: [
    'AA',
    'AS',
    'AC',
    'SS',
    'SC'
  ],
  
  // Default Values
  DEFAULTS: {
    PLATFORM_FEE_PERCENTAGE: 10,
    MIN_WITHDRAWAL_AMOUNT: 10000,
    CANCELLATION_HOURS: 24,
    MAX_APPOINTMENTS_PER_DAY: 10,
    APPOINTMENT_DURATION_MINUTES: 60,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    OTP_EXPIRY_MINUTES: 10,
    TOKEN_EXPIRY_HOURS: 24
  },
  
  // File Types
  FILE_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    PDF: ['application/pdf'],
    DOCUMENT: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    DUPLICATE_ENTRY: 'Duplicate entry',
    INTERNAL_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_DISABLED: 'Account is disabled',
    EMAIL_NOT_VERIFIED: 'Email not verified',
    PHONE_NOT_VERIFIED: 'Phone not verified',
    INSUFFICIENT_FUNDS: 'Insufficient funds',
    APPOINTMENT_NOT_AVAILABLE: 'Appointment slot not available',
    CANCELLATION_NOT_ALLOWED: 'Cancellation not allowed within 24 hours'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    VERIFICATION_SENT: 'Verification code sent',
    VERIFIED: 'Verification successful',
    PAYMENT_SUCCESS: 'Payment successful',
    REFUND_SUCCESS: 'Refund successful'
  },
  
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
  },
  
  // Cache Keys
  CACHE_KEYS: {
    USER: (id) => `user:${id}`,
    DOCTOR: (id) => `doctor:${id}`,
    PATIENT: (id) => `patient:${id}`,
    APPOINTMENT: (id) => `appointment:${id}`,
    MEDICATIONS: 'medications:all',
    CATEGORIES: 'medications:categories'
  },
  
  // Redis Cache TTL (seconds)
  CACHE_TTL: {
    USER: 3600,
    DOCTOR: 1800,
    PATIENT: 1800,
    APPOINTMENT: 300,
    MEDICATIONS: 3600,
    CATEGORIES: 86400
  },
  
  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },
  
  // Time Formats
  TIME_FORMATS: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    HUMAN_DATE: 'MMM DD, YYYY',
    HUMAN_TIME: 'h:mm A',
    HUMAN_DATETIME: 'MMM DD, YYYY h:mm A'
  },
  
  // Currency
  CURRENCY: {
    CODE: 'NGN',
    SYMBOL: '₦',
    NAME: 'Nigerian Naira'
  },
  
  // Video Call
  VIDEO_CALL: {
    MAX_DURATION_MINUTES: 60,
    MAX_PARTICIPANTS: 2,
    TOKEN_EXPIRY_HOURS: 1
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 5
  }
};