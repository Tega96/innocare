// backend/src/models/User.js
const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class User {
  constructor() {
    this.tableName = 'users';
  }

  /**
   * Create a new user
   */
  async create(userData) {
    const { email, phone, password, role } = userData;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Generate verification tokens
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const phoneVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await query(
      `INSERT INTO users 
       (id, email, phone, password_hash, role, email_verification_token, phone_verification_code) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
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
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0];
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone) {
    const result = await query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT id, email, phone, role, is_email_verified, is_phone_verified, is_active, created_at, last_login 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Update user
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.email) {
      fields.push(`email = $${paramIndex}`);
      values.push(updates.email);
      paramIndex++;
    }
    
    if (updates.phone) {
      fields.push(`phone = $${paramIndex}`);
      values.push(updates.phone);
      paramIndex++;
    }
    
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 10);
      fields.push(`password_hash = $${paramIndex}`);
      values.push(hashedPassword);
      paramIndex++;
    }
    
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex}`);
      values.push(updates.is_active);
      paramIndex++;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    const result = await query(
      `UPDATE users 
       SET is_email_verified = true, email_verification_token = NULL 
       WHERE email_verification_token = $1 AND is_email_verified = false
       RETURNING id, email`,
      [token]
    );
    return result.rows[0];
  }

  /**
   * Verify phone with code
   */
  async verifyPhone(userId, code) {
    const result = await query(
      `UPDATE users 
       SET is_phone_verified = true, phone_verification_code = NULL 
       WHERE id = $1 AND phone_verification_code = $2 AND is_phone_verified = false
       RETURNING id, phone`,
      [userId, code]
    );
    return result.rows[0];
  }

  /**
   * Compare password
   */
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email) {
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
   * Create password reset OTP
   */
  async createPasswordResetOTP(email) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const result = await query(
      `UPDATE users 
       SET reset_password_otp = $1, reset_password_otp_expires = $2 
       WHERE email = $3 
       RETURNING id, email`,
      [otp, otpExpires, email]
    );
    
    return result.rows[0] ? { otp, userId: result.rows[0].id } : null;
  }

  /**
   * Verify password reset OTP
   */
  async verifyPasswordResetOTP(email, otp) {
    const result = await query(
      `UPDATE users 
       SET reset_password_otp = NULL, reset_password_otp_expires = NULL
       WHERE email = $1 AND reset_password_otp = $2 AND reset_password_otp_expires > NOW()
       RETURNING id, email`,
      [email, otp]
    );
    
    return result.rows[0];
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword) {
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
   * Update last login
   */
  async updateLastLogin(userId) {
    await query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId) {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Activate user
   */
  async activateUser(userId) {
    const result = await query(
      'UPDATE users SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING id',
      [userId]
    );
    return result.rows[0];
  }

  /**
   * Get user count by role
   */
  async getCountByRole() {
    const result = await query(
      `SELECT role, COUNT(*) as count 
       FROM users 
       WHERE is_active = true 
       GROUP BY role`,
      []
    );
    
    const counts = {};
    result.rows.forEach(row => {
      counts[row.role] = parseInt(row.count);
    });
    
    return counts;
  }

  /**
   * Search users
   */
  async search(queryParams) {
    const { search, role, status, limit = 20, offset = 0 } = queryParams;
    
    let sql = `
      SELECT u.id, u.email, u.phone, u.role, u.is_active, u.is_email_verified,
             u.is_phone_verified, u.created_at, u.last_login,
             COALESCE(p.first_name, d.first_name) as first_name,
             COALESCE(p.last_name, d.last_name) as last_name
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      sql += ` AND (u.email ILIKE $${paramIndex} 
                OR u.phone ILIKE $${paramIndex}
                OR COALESCE(p.first_name, d.first_name) ILIKE $${paramIndex}
                OR COALESCE(p.last_name, d.last_name) ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (role && role !== 'all') {
      sql += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    if (status === 'active') {
      sql += ` AND u.is_active = true`;
    } else if (status === 'inactive') {
      sql += ` AND u.is_active = false`;
    }
    
    sql += ` ORDER BY u.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }
}

module.exports = new User();