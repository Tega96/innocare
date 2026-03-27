// Global type definitions for your application

// User types
export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profile: PatientProfile | DoctorProfile | null;
  createdAt: string;
  lastLogin?: string;
}

// Patient profile
export interface PatientProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodGroup?: string;
  genotype?: string;
  allergies?: string;
  currentPregnancyWeek?: number;
  expectedDueDate?: string;
  profileImageUrl?: string;
}

// Doctor profile
export interface DoctorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualifications?: string;
  yearsOfExperience: number;
  consultationFee: number;
  hospitalName: string;
  hospitalAddress?: string;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  maxAppointmentsPerDay: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  bio?: string;
  profileImageUrl?: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  type: 'video' | 'in_person';
  symptoms?: string;
  notes?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentAmount: number;
  platformFee: number;
  doctorEarnings: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  doctorFirstName?: string;
  doctorLastName?: string;
  doctorSpecialization?: string;
  patientFirstName?: string;
  patientLastName?: string;
}

// Health record types
export interface HealthRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  fetalMovementsPerDay?: number;
  symptoms: Record<string, string>;
  notes?: string;
}

// Medication types
export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  description?: string;
  price: number;
  requiresPrescription: boolean;
  stockQuantity: number;
  unit: string;
  manufacturer?: string;
  expiryDate?: string;
  inStock: boolean;
}

// Order types
export interface Order {
  id: string;
  patientId: string;
  orderType: 'prescription' | 'over_the_counter';
  prescriptionId?: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  price: number;
}

// Prescription types
export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  issuedDate: string;
  expiryDate: string;
  notes?: string;
  status: 'active' | 'dispensed' | 'expired' | 'cancelled';
  doctorFirstName?: string;
  doctorLastName?: string;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions?: string;
  price: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  senderEmail?: string;
  recipientEmail?: string;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  appointmentId?: string;
  orderId?: string;
  amount: number;
  transactionReference: string;
  paymentMethod?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  createdAt: string;
  paidAt?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface PatientRegisterFormData {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface DoctorRegisterFormData {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  specialization: string;
  consultationFee: number;
  hospitalName: string;
  hospitalAddress?: string;
  yearsOfExperience?: number;
  qualifications?: string;
  availableDays: string[];
  availableTimeStart: string;
  availableTimeEnd: string;
  maxAppointmentsPerDay?: number;
}

export interface AppointmentBookingFormData {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  type: 'video' | 'in_person';
  symptoms?: string;
  notes?: string;
  recordingConsent?: boolean;
}

export interface HealthRecordFormData {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weightKg?: number;
  heightCm?: number;
  fundalHeightCm?: number;
  fetalHeartRate?: number;
  fetalMovementsPerDay?: number;
  symptoms: Record<string, string>;
  notes?: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerPatient: (data: PatientRegisterFormData) => Promise<{ success: boolean; user?: User; error?: string }>;
  registerDoctor: (data: DoctorRegisterFormData) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<{ success: boolean }>;
  verifyPhone: (userId: string, code: string) => Promise<{ success: boolean }>;
}

export interface SocketContextType {
  socket: any | null;
  isConnected: boolean;
}