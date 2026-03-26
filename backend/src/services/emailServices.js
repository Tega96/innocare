// backend/src/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

class EmailService {
  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify?token=${token}&type=email`;
    
    const mailOptions = {
      from: `"Innocare" <${process.env.EMAIL_FROM}>`,
      to: email,
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
              <h1>Welcome to MaternityCare!</h1>
            </div>
            <div class="content">
              <p>Thank you for registering with MaternityCare. Please verify your email address to get started.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 MaternityCare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"InnoCare" <${process.env.EMAIL_FROM}>`,
      to: email,
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
              <p>You requested to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <div class="warning">
                <p>⚠️ If you didn't request this, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2026 InnoCare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Password reset email error:', error);
      throw error;
    }
  }

  async sendAppointmentConfirmation(email, appointmentDetails) {
    const mailOptions = {
      from: `"InnoCare" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Appointment Confirmed - InnoCare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .details { background: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="content">
              <p>Your appointment has been confirmed!</p>
              <div class="details">
                <h3>Appointment Details:</h3>
                <p><strong>Date:</strong> ${appointmentDetails.date}</p>
                <p><strong>Time:</strong> ${appointmentDetails.time}</p>
                <p><strong>Doctor:</strong> Dr. ${appointmentDetails.doctorName}</p>
                <p><strong>Type:</strong> ${appointmentDetails.type}</p>
              </div>
              <p>Please arrive 10 minutes before your appointment time.</p>
              <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 InnoCare. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Appointment confirmation email error:', error);
    }
  }
}

module.exports = new EmailService();