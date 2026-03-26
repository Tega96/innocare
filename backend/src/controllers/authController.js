// backend/src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
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
      const { email, phone, password, firstName, lastName, dateOfBirth, ...patientData } = req.body;
      
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
        `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, ...) 
         VALUES ($1, $2, $3, $4, ...) 
         RETURNING *`,
        [user.id, firstName, lastName, dateOfBirth, ...]
      );
      
      // Send verification email
      await emailService.sendVerificationEmail(email, user.emailVerificationToken);
      
      // Send verification SMS
      await smsService.sendVerificationCode(phone, user.phoneVerificationCode);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        message: 'Patient registered successfully. Please verify your email and phone.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profile: patientProfile.rows[0]
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register patient' });
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
      await emailService.sendVerificationEmail(email, user.emailVerificationToken);
      
      // Send verification SMS
      await smsService.sendVerificationCode(phone, user.phoneVerificationCode);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.status(201).json({
        message: 'Doctor registered successfully. Please verify your email and phone.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
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
      
      // Update last