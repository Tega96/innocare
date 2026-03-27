// backend/src/utils/helpers.js
const crypto = require('crypto');
const moment = require('moment');

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate OTP
 */
const generateOTP = (length = 6) => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return null;
  return moment(date).format(format);
};

/**
 * Calculate age from date of birth
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = moment();
  const birthDate = moment(dateOfBirth);
  return today.diff(birthDate, 'years');
};

/**
 * Calculate pregnancy week from due date
 */
const calculatePregnancyWeek = (dueDate) => {
  if (!dueDate) return null;
  const today = moment();
  const due = moment(dueDate);
  const conception = due.clone().subtract(40, 'weeks');
  const weeks = today.diff(conception, 'weeks');
  return Math.min(40, Math.max(0, weeks));
};

/**
 * Validate email
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone number
 */
const isValidPhone = (phone) => {
  const re = /^[0-9+\-\s()]+$/;
  return re.test(phone);
};

/**
 * Mask sensitive data
 */
const maskSensitiveData = (data, fields = ['password', 'token', 'secret']) => {
  const masked = { ...data };
  fields.forEach(field => {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  });
  return masked;
};

/**
 * Paginate results
 */
const paginate = (data, page = 1, limit = 20) => {
  const start = (page - 1) * limit;
  const end = page * limit;
  const paginatedData = data.slice(start, end);
  
  return {
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: end < data.length,
      hasPrev: start > 0
    }
  };
};

/**
 * Sleep/delay
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Get random item from array
 */
const randomItem = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Group array by key
 */
const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const groupKey = item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
};

/**
 * Calculate percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract initials from name
 */
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

/**
 * Generate slug from string
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

/**
 * Parse JSON safely
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

/**
 * Stringify JSON safely
 */
const safeJsonStringify = (obj, defaultValue = null) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
};

module.exports = {
  generateRandomString,
  generateOTP,
  formatCurrency,
  formatDate,
  calculateAge,
  calculatePregnancyWeek,
  isValidEmail,
  isValidPhone,
  maskSensitiveData,
  paginate,
  sleep,
  retry,
  deepClone,
  isEmpty,
  randomItem,
  groupBy,
  calculatePercentage,
  formatFileSize,
  getInitials,
  generateSlug,
  safeJsonParse,
  safeJsonStringify
};