const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * User Model - Handles all user-related database operations
 * This includes patients, doctors, and admins
 */
class User {
  /**
   * Create a new user with hashed password
   */
  static async create(userData) {
    const { email, phone, password, role } = userData;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate verification tokens
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await query(
      `INSERT INTO users 
       (email, phone, password_hash, role, email_verification_token, phone_verification_code) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, phone, role, is_email_verified, is_phone_verified, created_at`,
      [email, phone, passwordHash, role, emailVerificationToken, phoneVerificationCode]
    );
    
    return {
      ...result.rows[0],
      emailVerificationToken,
      phoneVerificationCode
    };
  }
  
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
  
  /**
   * Find user by phone
   */
  static async findByPhone(phone) {
    const result = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0];
  }
  
  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, email, phone, role, is_email_verified, is_phone_verified, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
  
  /**
   * Verify email with token
   */
  static async verifyEmail(token) {
    const result = await query(
      `UPDATE users 
       SET is_email_verified = true, email_verification_token = NULL 
       WHERE email_verification_token = $1 
       RETURNING id, email`,
      [token]
    );
    return result.rows[0];
  }
  
  /**
   * Verify phone with code
   */
  static async verifyPhone(userId, code) {
    const result = await query(
      `UPDATE users 
       SET is_phone_verified = true, phone_verification_code = NULL 
       WHERE id = $1 AND phone_verification_code = $2 
       RETURNING id, phone`,
      [userId, code]
    );
    return result.rows[0];
  }
  
  /**
   * Compare password for login
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
  /**
   * Generate password reset token
   */
  static async createPasswordResetToken(email) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    const result = await query(
      `UPDATE users 
       SET reset_password_token = $1, reset_password_expires = $2 
       WHERE email = $3 
       RETURNING id, email`,
      [resetToken, resetExpires, email]
    );
    
    return result.rows[0] ? resetToken : null;
  }
  
  /**
   * Reset password using token
   */
  static async resetPassword(token, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const result = await query(
      `UPDATE users 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL 
       WHERE reset_password_token = $2 AND reset_password_expires > NOW() 
       RETURNING id, email`,
      [passwordHash, token]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update user's last login
   */
  static async updateLastLogin(userId) {
    await query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(userId) {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = User;