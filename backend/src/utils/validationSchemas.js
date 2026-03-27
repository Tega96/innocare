// backend/src/utils/validationSchemas.js
const Joi = require('joi');

// User validation schemas
const userSchemas = {
  registerPatient: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.date().iso().required(),
    address: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional()
  }),
  
  registerDoctor: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    specialization: Joi.string().required(),
    consultationFee: Joi.number().positive().required(),
    hospitalName: Joi.string().required(),
    hospitalAddress: Joi.string().optional(),
    yearsOfExperience: Joi.number().min(0).optional(),
    qualifications: Joi.string().optional(),
    availableDays: Joi.array().items(Joi.string()).optional(),
    availableTimeStart: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    availableTimeEnd: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    maxAppointmentsPerDay: Joi.number().min(1).max(50).optional()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),
  
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),
  
  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
  })
};

// Appointment validation schemas
const appointmentSchemas = {
  bookAppointment: Joi.object({
    doctorId: Joi.string().uuid().required(),
    appointmentDate: Joi.date().iso().greater('now').required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
    type: Joi.string().valid('video', 'in_person').required(),
    symptoms: Joi.string().optional(),
    notes: Joi.string().optional(),
    recordingConsent: Joi.boolean().optional()
  }),
  
  cancelAppointment: Joi.object({
    reason: Joi.string().optional()
  }),
  
  rescheduleAppointment: Joi.object({
    newDate: Joi.date().iso().greater('now').required(),
    newTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required()
  })
};

// Health record validation schemas
const healthSchemas = {
  addHealthRecord: Joi.object({
    blood_pressure_systolic: Joi.number().min(70).max(200).optional(),
    blood_pressure_diastolic: Joi.number().min(40).max(120).optional(),
    heart_rate: Joi.number().min(40).max(200).optional(),
    temperature: Joi.number().min(35).max(42).optional(),
    weight_kg: Joi.number().min(30).max(200).optional(),
    height_cm: Joi.number().min(100).max(250).optional(),
    fundal_height_cm: Joi.number().min(10).max(50).optional(),
    fetal_heart_rate: Joi.number().min(60).max(200).optional(),
    fetal_movements_per_day: Joi.number().min(0).max(100).optional(),
    symptoms: Joi.object().optional(),
    notes: Joi.string().optional()
  })
};

// Pharmacy validation schemas
const pharmacySchemas = {
  checkout: Joi.object({
    items: Joi.array().items(Joi.object({
      medicationId: Joi.string().uuid().required(),
      quantity: Joi.number().min(1).required(),
      price: Joi.number().positive().required()
    })).min(1).required(),
    deliveryAddress: Joi.string().required(),
    prescriptionId: Joi.string().uuid().optional()
  }),
  
  orderPrescription: Joi.object({
    deliveryAddress: Joi.string().required()
  }),
  
  addMedication: Joi.object({
    name: Joi.string().required(),
    generic_name: Joi.string().optional(),
    category: Joi.string().required(),
    description: Joi.string().optional(),
    price: Joi.number().positive().required(),
    requires_prescription: Joi.boolean().default(false),
    stock_quantity: Joi.number().min(0).default(0),
    unit: Joi.string().required(),
    manufacturer: Joi.string().optional(),
    expiry_date: Joi.date().iso().optional()
  }),
  
  updateMedication: Joi.object({
    name: Joi.string().optional(),
    generic_name: Joi.string().optional(),
    category: Joi.string().optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    requires_prescription: Joi.boolean().optional(),
    stock_quantity: Joi.number().min(0).optional(),
    unit: Joi.string().optional(),
    manufacturer: Joi.string().optional(),
    expiry_date: Joi.date().iso().optional()
  }),
  
  adjustInventory: Joi.object({
    medicationId: Joi.string().uuid().required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().optional()
  })
};

// Payment validation schemas
const paymentSchemas = {
  initializePayment: Joi.object({
    amount: Joi.number().positive().required(),
    paymentType: Joi.string().valid('consultation', 'medication').required(),
    appointmentId: Joi.string().uuid().optional(),
    orderId: Joi.string().uuid().optional()
  }),
  
  refund: Joi.object({
    reason: Joi.string().required()
  })
};

// Chat validation schemas
const chatSchemas = {
  sendMessage: Joi.object({
    recipientId: Joi.string().uuid().required(),
    message: Joi.string().required(),
    messageType: Joi.string().valid('text', 'image', 'file').default('text'),
    consentForRecords: Joi.boolean().default(false)
  })
};

// Doctor validation schemas
const doctorSchemas = {
  updateProfile: Joi.object({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    specialization: Joi.string().optional(),
    qualifications: Joi.string().optional(),
    years_of_experience: Joi.number().min(0).optional(),
    consultation_fee: Joi.number().positive().optional(),
    hospital_name: Joi.string().optional(),
    hospital_address: Joi.string().optional(),
    available_days: Joi.array().items(Joi.string()).optional(),
    available_time_start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    available_time_end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    max_appointments_per_day: Joi.number().min(1).max(50).optional(),
    bio: Joi.string().optional()
  }),
  
  requestWithdrawal: Joi.object({
    amount: Joi.number().positive().min(10000).required()
  }),
  
  saveBankDetails: Joi.object({
    bank_name: Joi.string().required(),
    account_number: Joi.string().length(10).required(),
    account_name: Joi.string().required()
  })
};

// Patient validation schemas
const patientSchemas = {
  updateProfile: Joi.object({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    date_of_birth: Joi.date().iso().optional(),
    address: Joi.string().optional(),
    emergency_contact_name: Joi.string().optional(),
    emergency_contact_phone: Joi.string().optional(),
    blood_group: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    genotype: Joi.string().valid('AA', 'AS', 'AC', 'SS', 'SC').optional(),
    allergies: Joi.string().optional(),
    current_pregnancy_week: Joi.number().min(0).max(42).optional(),
    expected_due_date: Joi.date().iso().optional()
  })
};

// Admin validation schemas
const adminSchemas = {
  updateSettings: Joi.object({
    platform_fee_percentage: Joi.number().min(0).max(100).optional(),
    min_withdrawal_amount: Joi.number().positive().optional(),
    cancellation_hours: Joi.number().min(1).max(72).optional(),
    maintenance_mode: Joi.boolean().optional(),
    maintenance_message: Joi.string().optional()
  })
};

// Export all schemas
module.exports = {
  userSchemas,
  appointmentSchemas,
  healthSchemas,
  pharmacySchemas,
  paymentSchemas,
  chatSchemas,
  doctorSchemas,
  patientSchemas,
  adminSchemas
};