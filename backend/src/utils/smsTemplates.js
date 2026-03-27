// backend/src/utils/smsTemplates.js
const smsTemplates = {
  // Verification code
  verificationCode: (code) => ({
    body: `Welcome to InnoCare! Your verification code is: ${code}. This code will expire in 10 minutes.`
  }),

  // Appointment reminder
  appointmentReminder: (doctorName, date, time) => ({
    body: `Reminder: You have an appointment with Dr. ${doctorName} on ${date} at ${time}. Please arrive 10 minutes early.`
  }),

  // Appointment confirmation
  appointmentConfirmation: (doctorName, date, time) => ({
    body: `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been confirmed.`
  }),

  // Appointment cancellation
  appointmentCancellation: (doctorName, date, time) => ({
    body: `Your appointment with Dr. ${doctorName} on ${date} at ${time} has been cancelled.`
  }),

  // Payment confirmation
  paymentConfirmation: (amount, reference) => ({
    body: `Payment of ₦${amount} successful. Reference: ${reference}. Thank you for choosing InnoCare!`
  }),

  // Prescription notification
  prescriptionNotification: (doctorName) => ({
    body: `Dr. ${doctorName} has issued a new prescription for you. Log in to view and order your medications.`
  }),

  // Order status update
  orderStatusUpdate: (orderId, status) => ({
    body: `Your order #${orderId} has been ${status}. Track your order in the app.`
  }),

  // Password reset OTP
  passwordResetOTP: (code) => ({
    body: `Your password reset code is: ${code}. This code will expire in 10 minutes.`
  }),

  // Welcome message
  welcome: (name, role) => ({
    body: `Welcome to InnoCare, ${name}! Start your journey with us today. Log in to explore your dashboard.`
  })
};

module.exports = smsTemplates;