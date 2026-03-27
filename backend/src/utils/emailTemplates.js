// backend/src/utils/emailTemplates.js
const emailTemplates = {
  // Welcome email for new users
  welcome: (name, role) => ({
    subject: `Welcome to InnoCare, ${name}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to InnoCare!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Thank you for joining InnoCare! We're excited to have you as part of our community.</p>
            <p>As a ${role}, you can:</p>
            <ul>
              ${role === 'patient' ? `
                <li>Connect with experienced obstetricians</li>
                <li>Book video or in-person appointments</li>
                <li>Track your health and pregnancy progress</li>
                <li>Order medications online</li>
                <li>Access your medical records anytime</li>
              ` : `
                <li>Manage your practice and appointments</li>
                <li>Connect with patients remotely</li>
                <li>Track your earnings and withdrawals</li>
                <li>Issue prescriptions digitally</li>
                <li>Monitor patient health remotely</li>
              `}
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Get Started</a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Email verification
  emailVerification: (name, token) => ({
    subject: 'Verify Your Email Address - InnoCare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Please verify your email address to complete your registration.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/verify-email?token=${token}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link: ${process.env.FRONTEND_URL}/verify-email?token=${token}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Password reset
  passwordReset: (name, token) => ({
    subject: 'Reset Your Password - InnoCare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link: ${process.env.FRONTEND_URL}/reset-password?token=${token}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="warning">
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Appointment confirmation
  appointmentConfirmation: (name, doctorName, date, time, type) => ({
    subject: 'Appointment Confirmed - InnoCare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your appointment has been confirmed!</p>
            <div class="details">
              <h3>Appointment Details:</h3>
              <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Type:</strong> ${type === 'video' ? 'Video Consultation' : 'In-Person Visit'}</p>
            </div>
            <p>Please arrive 10 minutes before your appointment time.</p>
            <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Payment confirmation
  paymentConfirmation: (name, amount, reference, type) => ({
    subject: 'Payment Confirmation - InnoCare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Your payment has been processed successfully.</p>
            <div class="details">
              <h3>Payment Details:</h3>
              <p><strong>Amount:</strong> ₦${amount}</p>
              <p><strong>Reference:</strong> ${reference}</p>
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>Thank you for choosing InnoCare!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // Prescription notification
  prescriptionNotification: (name, doctorName) => ({
    subject: 'New Prescription - InnoCare',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Prescription Available</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>Dr. ${doctorName} has issued a new prescription for you.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/patient/prescriptions" class="button">View Prescription</a>
            </div>
            <p>You can order your medications directly through our pharmacy.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} InnoCare. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

module.exports = emailTemplates;