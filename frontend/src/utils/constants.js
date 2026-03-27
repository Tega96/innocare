// frontend/src/utils/constants.js
export const APP_NAME = 'MaternityCare';
export const APP_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER_PATIENT: '/auth/register/patient',
    REGISTER_DOCTOR: '/auth/register/doctor',
    VERIFY_EMAIL: '/auth/verify-email',
    VERIFY_PHONE: '/auth/verify-phone',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    RESEND_VERIFICATION: '/auth/resend-verification',
    ME: '/auth/me',
  },
  APPOINTMENTS: {
    SEARCH_DOCTORS: '/appointments/doctors/search',
    AVAILABLE_SLOTS: '/appointments/available-slots',
    BOOK: '/appointments/book',
    PATIENT: '/appointments/patient',
    DOCTOR: '/appointments/doctor',
    CANCEL: '/appointments/:id/cancel',
    COMPLETE: '/appointments/:id/complete',
  },
  HEALTH: {
    RECORDS: '/health/records',
    ADD: '/health/record',
    PATIENT: '/health/patient',
  },
  PHARMACY: {
    MEDICATIONS: '/pharmacy/medications',
    PRESCRIPTIONS: '/pharmacy/prescriptions',
    CHECKOUT: '/pharmacy/checkout',
    ORDERS: '/pharmacy/orders',
  },
  CHAT: {
    MESSAGES: '/chat/messages',
    SEND: '/chat/send',
    MARK_READ: '/chat/mark-read',
    UNREAD_COUNT: '/chat/unread-count',
  },
  VIDEO: {
    TOKEN: '/video/token',
    CALL_END: '/video/call',
    RECORDING_START: '/video/recording/start',
    RECORDING_STOP: '/video/recording/stop',
  },
  PAYMENTS: {
    INITIALIZE: '/payments/initialize',
    VERIFY: '/payments/verify',
    HISTORY: '/payments/history',
    REFUND: '/payments/:id/refund',
  },
  DOCTOR: {
    PROFILE: '/doctors/profile',
    PATIENTS: '/doctors/patients',
    EARNINGS: '/doctors/earnings',
    TRANSACTIONS: '/doctors/transactions',
    WITHDRAW: '/doctors/withdraw',
    BANK_DETAILS: '/doctors/bank-details',
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    DOCTORS: '/admin/doctors',
    MEDICATIONS: '/admin/medications',
    REPORTS: '/admin/reports',
    REVENUE_DATA: '/admin/revenue-data',
  },
};

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER_PATIENT: '/register/patient',
  REGISTER_DOCTOR: '/register/doctor',
  VERIFY: '/verify',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  PATIENT: {
    DASHBOARD: '/patient/dashboard',
    SEARCH_DOCTORS: '/patient/search-doctors',
    BOOK_APPOINTMENT: '/patient/book-appointment/:doctorId',
    APPOINTMENTS: '/patient/appointments',
    HEALTH_STATUS: '/patient/health-status',
    PHARMACY: '/patient/pharmacy',
    VIDEO_CALL: '/patient/video-call/:appointmentId',
    CHAT: '/patient/chat/:doctorId',
    MEDICAL_RECORDS: '/patient/medical-records',
    PRESCRIPTIONS: '/patient/prescriptions',
  },
  DOCTOR: {
    DASHBOARD: '/doctor/dashboard',
    PATIENTS: '/doctor/patients',
    APPOINTMENTS: '/doctor/appointments',
    MONITOR: '/doctor/monitor/:patientId',
    VIDEO_CALL: '/doctor/video-call/:appointmentId',
    CHAT: '/doctor/chat/:patientId',
    EARNINGS: '/doctor/earnings',
    PROFILE: '/doctor/profile',
  },
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    INVENTORY: '/admin/inventory',
    DOCTORS: '/admin/doctors',
    USERS: '/admin/users',
    REPORTS: '/admin/reports',
  },
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'pharmacyCart',
  THEME: 'theme',
  NOTIFICATIONS: 'notifications',
};

export const PAYMENT = {
  MIN_WITHDRAWAL: 10000,
  PLATFORM_FEE_PERCENTAGE: 0.10,
  CURRENCY: 'NGN',
  INTERSWITCH_ENV: process.env.REACT_APP_INTERSWITCH_ENV || 'sandbox',
};

export const VIDEO = {
  APP_ID: process.env.REACT_APP_AGORA_APP_ID,
  DEFAULT_QUALITY: '720p',
  MAX_PARTICIPANTS: 2,
};

export const UPLOAD = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_FILES: 5,
};

export const APPOINTMENT = {
  DURATION_MINUTES: 60,
  CANCELLATION_HOURS: 24,
  MAX_ADVANCE_DAYS: 30,
};

export const NOTIFICATION = {
  DURATION: 5000,
  POSITION: 'top-right',
};

export const CHART_COLORS = {
  primary: '#0ea5e9',
  secondary: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec489a',
  gray: '#6b7280',
};