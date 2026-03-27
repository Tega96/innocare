// frontend/src/utils/validators.js
import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const patientRegisterSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string().matches(/^[0-9+\-\s()]+$/, 'Invalid phone number').required('Phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  dateOfBirth: yup.date().required('Date of birth is required').max(new Date(), 'Date of birth cannot be in the future'),
  address: yup.string(),
  emergencyContactName: yup.string(),
  emergencyContactPhone: yup.string(),
});

export const doctorRegisterSchema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  phone: yup.string().matches(/^[0-9+\-\s()]+$/, 'Invalid phone number').required('Phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  specialization: yup.string().required('Specialization is required'),
  consultationFee: yup.number().positive('Consultation fee must be positive').required('Consultation fee is required'),
  hospitalName: yup.string().required('Hospital name is required'),
  yearsOfExperience: yup.number().min(0, 'Years of experience must be positive'),
  qualifications: yup.string(),
});

export const appointmentSchema = yup.object({
  doctorId: yup.string().required('Doctor is required'),
  appointmentDate: yup.date().min(new Date(), 'Appointment date must be in the future').required('Date is required'),
  startTime: yup.string().required('Time is required'),
  type: yup.string().oneOf(['video', 'in_person']).required('Appointment type is required'),
  symptoms: yup.string(),
  notes: yup.string(),
});

export const healthRecordSchema = yup.object({
  blood_pressure_systolic: yup.number().min(70, 'Invalid systolic pressure').max(200, 'Invalid systolic pressure'),
  blood_pressure_diastolic: yup.number().min(40, 'Invalid diastolic pressure').max(120, 'Invalid diastolic pressure'),
  heart_rate: yup.number().min(40, 'Heart rate too low').max(200, 'Heart rate too high'),
  temperature: yup.number().min(35, 'Temperature too low').max(42, 'Temperature too high'),
  weight_kg: yup.number().min(30, 'Weight too low').max(200, 'Weight too high'),
  symptoms: yup.object(),
  notes: yup.string(),
});

export const pharmacyOrderSchema = yup.object({
  items: yup.array().min(1, 'Cart is empty').required(),
  totalAmount: yup.number().positive('Invalid amount').required(),
  prescriptionId: yup.string().nullable(),
  deliveryAddress: yup.string().required('Delivery address is required'),
});

export const withdrawalSchema = yup.object({
  amount: yup.number().min(10000, 'Minimum withdrawal is ₦10,000').required('Amount is required'),
});

export const bankDetailsSchema = yup.object({
  bank_name: yup.string().required('Bank name is required'),
  account_number: yup.string().length(10, 'Account number must be 10 digits').required('Account number is required'),
  account_name: yup.string().required('Account name is required'),
});