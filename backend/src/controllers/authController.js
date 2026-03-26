// backend/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

/**
 * Authentication Controller
 * Handles user registration, login, verification, and password reset
 */
class AuthController {
  /**
   * Register a new patient
   * POST /api/auth/register/patient
   */
  async registerPatient(req, res) {
    try {
      const { email, phone, password, firstName, lastName, dateOfBirth, address, emergencyContactName, emergencyContactPhone } = req.body;
      
      // Check if user already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      
      // Create user
      const user = await User.create({
        email,
        phone,
        password,
        role: 'patient'
      });
      
      // Create patient profile
      const patientProfile = await query(
        `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, address, emergency_contact_name, emergency_contact_phone) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [user.id, firstName, lastName, dateOfBirth, address, emergencyContactName, emergencyContactPhone]
      );
      
      // Send verification email
      emailService.sendVerificationEmail(email, user.emailVerificationToken);
      
      // Send verification SMS
      smsService.sendVerificationCode(phone, user.phoneVerificationCode);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.status(201).json({
        message: 'Patient registered successfully. Please verify your email and phone.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.is_email_verified,
          isPhoneVerified: user.is_phone_verified,
          profile: patientProfile.rows[0]
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register patient: ' + error.message });
    }
  }
  
  /**
   * Register a new doctor
   * POST /api/auth/register/doctor
   */
  async registerDoctor(req, res) {
    try {
      const { 
        email, phone, password, firstName, lastName, 
        specialization, consultationFee, hospitalName, 
        yearsOfExperience, qualifications, availableDays, 
        availableTimeStart, availableTimeEnd, maxAppointmentsPerDay 
      } = req.body;
      
      // Check if user already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      const existingPhone = await User.findByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
      
      // Create user
      const user = await User.create({
        email,
        phone,
        password,
        role: 'doctor'
      });
      
      // Create doctor profile
      const doctorProfile = await query(
        `INSERT INTO doctors 
         (user_id, first_name, last_name, specialization, consultation_fee, 
          hospital_name, years_of_experience, qualifications, available_days, 
          available_time_start, available_time_end, max_appointments_per_day) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING *`,
        [user.id, firstName, lastName, specialization, consultationFee, 
         hospitalName, yearsOfExperience, qualifications, availableDays, 
         availableTimeStart, availableTimeEnd, maxAppointmentsPerDay || 10]
      );
      
      // Send verification email
      emailService.sendVerificationEmail(email, user.emailVerificationToken).catch(console.error);
      
      // Send verification SMS
      smsService.sendVerificationCode(phone, user.phoneVerificationCode).catch(console.error);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      
      res.status(201).json({
        message: 'Doctor registered successfully. Please verify your email and phone.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.is_email_verified,
          isPhoneVerified: user.is_phone_verified,
          profile: doctorProfile.rows[0]
        }
      });
    } catch (error) {
      console.error('Doctor registration error:', error);
      res.status(500).json({ error: 'Failed to register doctor' });
    }
  }
  
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is disabled. Contact support.' });
      }
      
      // Verify password
      const isValidPassword = await User.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
            
      // Update last login
      await User.updateLastLogin(user.id);
      
      // Get profile based on role
      let profile = null;
      if (user.role === 'patient') {
        const profileResult = await query(
          'SELECT * FROM patients WHERE user_id = $1',
          [user.id]
        );
        profile = profileResult.rows[0];
      } else if (user.role === 'doctor') {
        const profileResult = await query(
          'SELECT * FROM doctors WHERE user_id = $1',
          [user.id]
        );
        profile = profileResult.rows[0];
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role,
          isEmailVerified: user.is_email_verified,
          isPhoneVerified: user.is_phone_verified
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.is_email_verified,
          isPhoneVerified: user.is_phone_verified,
          profile
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  /**
   * Get user data
   * GET /api/auth/.......
   */
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({error: 'User not found'});
      }

      // Get profile
      let profile = null;
      if (user.role === 'patient') {
        const profileResult = await query(
          'SELECT * FROM patients WHERE user_id = $1', 
          [user.id]
        );
        profile = profileResult.rows[0];
      } else if (user.role === 'doctor') {
        const profileResult = await query(
          'SELECT * FROM doctors WHERE user_id = $1',
          [user.id]
        );
        profile = profileResult.rows[0];
      } 

      res.json({
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.is_email_verified,
          isPhoneVerified: user.is_phone_verified,
          profile
        }
      });
    } catch (error) {
      console.error('Get me error: ', error);
      res.status(500).json({ error: 'Failed to get user data'});
    }
  }
  
  /**
   * Verify email with token
   * GET /api/auth/verify-email/:token
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      const user = await User.verifyEmail(token);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }
      
      res.json({
        message: 'Email verified successfully. You can now login.',
        email: user.email
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
  
  /**
   * Verify phone with code
   * POST /api/auth/verify-phone
   */
  async verifyPhone(req, res) {
    try {
      const { userId, code } = req.body;
      
      const user = await User.verifyPhone(userId, code);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }
      
      res.json({
        message: 'Phone verified successfully',
        phone: user.phone
      });
    } catch (error) {
      console.error('Phone verification error:', error);
      res.status(500).json({ error: 'Failed to verify phone' });
    }
  }
  
  /**
   * Resend verification email
   * POST /api/auth/resend-verification-email
   */
  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;
      
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (user.is_email_verified) {
        return res.status(400).json({ error: 'Email already verified' });
      }
      
      // Generate new token
      const newToken = crypto.randomBytes(32).toString('hex');
      await query(
        'UPDATE users SET email_verification_token = $1 WHERE id = $2',
        [newToken, user.id]
      );
      
      await emailService.sendVerificationEmail(email, newToken);
      
      res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Resend email error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }
  
  /**
   * Forgot password - send reset link
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      const resetToken = await User.createPasswordResetToken(email);
      
      if (resetToken) {
        await emailService.sendPasswordResetEmail(email, resetToken);
      }
      
      // Always return success to prevent email enumeration
      res.json({ 
        message: 'If an account exists with that email, you will receive a password reset link.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
  
  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      const user = await User.resetPassword(token, newPassword);
      
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
}

module.exports = new AuthController();