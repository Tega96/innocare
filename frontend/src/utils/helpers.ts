import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  return format(new Date(date), formatStr);
};

export const formatTime = (time: string): string => {
  if (!time) return 'N/A';
  return time.slice(0, 5);
};

export const formatDateTime = (date: string, time: string): string => {
  if (!date) return 'N/A';
  const dateStr = formatDate(date);
  const timeStr = formatTime(time);
  return `${dateStr} at ${timeStr}`;
};

export const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return '?';
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    verified: 'bg-green-100 text-green-800',
    unverified: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    verified: 'Verified',
    unverified: 'Unverified',
    paid: 'Paid',
    unpaid: 'Unpaid',
  };
  return texts[status] || status;
};

export const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getBloodGroupOptions = () => {
  return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
};

export const getSpecializations = () => {
  return [
    'Obstetrician',
    'Maternal-Fetal Medicine',
    'Perinatologist',
    'Midwife',
    'Family Medicine',
    'Nutritionist',
    'Gynecologist',
    'Neonatologist',
    'Pediatrician',
    'Anesthesiologist',
    'Radiologist',
    'Ultrasound Specialist'
  ];
};

export const getDaysOfWeek = () => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
};

export const getSymptomOptions = () => {
  return [
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
  ];
};

export const getSeverityOptions = () => {
  return [
    { value: 'none', label: 'None' },
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' }
  ];
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const re = /^[0-9+\-\s()]+$/;
  return re.test(phone);
};

export const validatePassword = (password: string): boolean => {
  return password && password.length >= 6;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T, 
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait)
  }
};

export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};