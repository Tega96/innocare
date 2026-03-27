// backend/src/controllers/adminController.js
const { query } = require('../config/database');
const logger = require('../utils/logger');

class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/admin/stats
   */
  async getStats(req, res) {
    try {
      const [
        userStats,
        appointmentStats,
        revenueStats,
        doctorStats
      ] = await Promise.all([
        query(
          `SELECT 
             COUNT(*) as total_users,
             COUNT(CASE WHEN role = 'patient' THEN 1 END) as total_patients,
             COUNT(CASE WHEN role = 'doctor' THEN 1 END) as total_doctors,
             COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
             COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
           FROM users
           WHERE is_active = true`,
          []
        ),
        query(
          `SELECT 
             COUNT(*) as total_appointments,
             COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_appointments,
             COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_appointments,
             COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_appointments,
             COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_appointments,
             COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_appointments_30d
           FROM appointments`,
          []
        ),
        query(
          `SELECT 
             COALESCE(SUM(amount), 0) as total_revenue,
             COALESCE(SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END), 0) as successful_payments,
             COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_payments,
             COUNT(*) as total_transactions
           FROM payments`,
          []
        ),
        query(
          `SELECT 
             COUNT(*) as total_doctors,
             COUNT(CASE WHEN is_verified THEN 1 END) as verified_doctors,
             COUNT(CASE WHEN NOT is_verified THEN 1 END) as pending_verification
           FROM doctors`,
          []
        )
      ]);
      
      res.json({
        users: userStats.rows[0],
        appointments: appointmentStats.rows[0],
        revenue: revenueStats.rows[0],
        doctors: doctorStats.rows[0]
      });
      
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  /**
   * Get revenue data for charts
   * GET /api/admin/revenue-data
   */
  async getRevenueData(req, res) {
    try {
      const { range = 'month' } = req.query;
      
      let interval;
      let dateFormat;
      
      switch(range) {
        case 'week':
          interval = '1 day';
          dateFormat = 'Mon DD';
          break;
        case 'month':
          interval = '1 day';
          dateFormat = 'MMM DD';
          break;
        case 'year':
          interval = '1 month';
          dateFormat = 'Mon YYYY';
          break;
        default:
          interval = '1 day';
          dateFormat = 'MMM DD';
      }
      
      const result = await query(
        `SELECT 
           DATE_TRUNC($1, created_at) as date,
           SUM(amount) as revenue,
           COUNT(*) as transaction_count
         FROM payments
         WHERE status = 'success'
           AND created_at >= NOW() - INTERVAL '1 year'
         GROUP BY DATE_TRUNC($1, created_at)
         ORDER BY date ASC`,
        [interval]
      );
      
      res.json({
        labels: result.rows.map(r => new Date(r.date).toLocaleDateString()),
        values: result.rows.map(r => parseFloat(r.revenue)),
        counts: result.rows.map(r => parseInt(r.transaction_count))
      });
      
    } catch (error) {
      logger.error('Get revenue data error:', error);
      res.status(500).json({ error: 'Failed to get revenue data' });
    }
  }

  /**
   * Get all users with pagination
   * GET /api/admin/users
   */
  async getUsers(req, res) {
    try {
      const { role, status, search, page = 1, limit = 20 } = req.query;
      
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
      
      if (search) {
        sql += ` AND (u.email ILIKE $${paramIndex} 
                  OR u.phone ILIKE $${paramIndex}
                  OR COALESCE(p.first_name, d.first_name) ILIKE $${paramIndex}
                  OR COALESCE(p.last_name, d.last_name) ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      sql += ` ORDER BY u.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      // Get total count
      let countSql = `SELECT COUNT(*) FROM users u WHERE 1=1`;
      const countParams = [];
      let countIndex = 1;
      
      if (role && role !== 'all') {
        countSql += ` AND u.role = $${countIndex}`;
        countParams.push(role);
        countIndex++;
      }
      
      const countResult = await query(countSql, countParams);
      
      res.json({
        users: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      });
      
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  /**
   * Get user details
   * GET /api/admin/users/:id
   */
  async getUserDetails(req, res) {
    try {
      const { id } = req.params;
      
      const user = await query(
        `SELECT u.*,
                p.* as patient_data,
                d.* as doctor_data
         FROM users u
         LEFT JOIN patients p ON u.id = p.user_id
         LEFT JOIN doctors d ON u.id = d.user_id
         WHERE u.id = $1`,
        [id]
      );
      
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user.rows[0]);
      
    } catch (error) {
      logger.error('Get user details error:', error);
      res.status(500).json({ error: 'Failed to get user details' });
    }
  }

  /**
   * Toggle user status
   * PUT /api/admin/users/:id/toggle-status
   */
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      
      const user = await query(
        'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      logger.info(`User ${id} status toggled to ${user.rows[0].is_active}`);
      
      res.json({
        message: `User ${user.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
        user: user.rows[0]
      });
      
    } catch (error) {
      logger.error('Toggle user status error:', error);
      res.status(500).json({ error: 'Failed to toggle user status' });
    }
  }

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      logger.info(`User ${id} deleted by admin ${req.user.id}`);
      
      res.json({ message: 'User deleted successfully' });
      
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Get doctors list
   * GET /api/admin/doctors
   */
  async getDoctors(req, res) {
    try {
      const { verified, page = 1, limit = 20 } = req.query;
      
      let sql = `
        SELECT d.*, u.email, u.phone, u.is_active,
               COUNT(a.id) as total_appointments,
               COALESCE(AVG(r.rating), 0) as avg_rating
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN appointments a ON d.id = a.doctor_id
        LEFT JOIN doctor_reviews r ON d.id = r.doctor_id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;
      
      if (verified === 'true') {
        sql += ` AND d.is_verified = true`;
      } else if (verified === 'false') {
        sql += ` AND d.is_verified = false`;
      }
      
      sql += ` GROUP BY d.id, u.email, u.phone
               ORDER BY d.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      res.json({
        doctors: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get doctors error:', error);
      res.status(500).json({ error: 'Failed to get doctors' });
    }
  }

  /**
   * Verify doctor
   * PUT /api/admin/doctors/:id/verify
   */
  async verifyDoctor(req, res) {
    try {
      const { id } = req.params;
      
      const doctor = await query(
        'UPDATE doctors SET is_verified = true, verified_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (doctor.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      
      logger.info(`Doctor ${id} verified by admin ${req.user.id}`);
      
      res.json({
        message: 'Doctor verified successfully',
        doctor: doctor.rows[0]
      });
      
    } catch (error) {
      logger.error('Verify doctor error:', error);
      res.status(500).json({ error: 'Failed to verify doctor' });
    }
  }

  /**
   * Get appointments report
   * GET /api/admin/reports/appointments
   */
  async getAppointmentsReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      let dateCondition = '';
      const params = [];
      let paramIndex = 1;
      
      if (start_date && end_date) {
        dateCondition = `AND a.appointment_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(start_date, end_date);
        paramIndex += 2;
      }
      
      const result = await query(
        `SELECT 
           DATE(a.appointment_date) as date,
           COUNT(*) as total,
           COUNT(CASE WHEN a.status = 'confirmed' THEN 1 END) as confirmed,
           COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
           COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled,
           COUNT(CASE WHEN a.type = 'video' THEN 1 END) as video,
           COUNT(CASE WHEN a.type = 'in_person' THEN 1 END) as in_person
         FROM appointments a
         WHERE 1=1 ${dateCondition}
         GROUP BY DATE(a.appointment_date)
         ORDER BY date ASC`,
        params
      );
      
      res.json({
        appointments: result.rows,
        start_date,
        end_date
      });
      
    } catch (error) {
      logger.error('Get appointments report error:', error);
      res.status(500).json({ error: 'Failed to get appointments report' });
    }
  }

  /**
   * Get users report
   * GET /api/admin/reports/users
   */
  async getUsersReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      let dateCondition = '';
      const params = [];
      let paramIndex = 1;
      
      if (start_date && end_date) {
        dateCondition = `AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(start_date, end_date);
        paramIndex += 2;
      }
      
      const result = await query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as total,
           COUNT(CASE WHEN role = 'patient' THEN 1 END) as patients,
           COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctors,
           COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
         FROM users
         WHERE 1=1 ${dateCondition}
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        params
      );
      
      // Get current totals
      const totals = await query(
        `SELECT 
           COUNT(*) as total_users,
           COUNT(CASE WHEN role = 'patient' THEN 1 END) as total_patients,
           COUNT(CASE WHEN role = 'doctor' THEN 1 END) as total_doctors
         FROM users`,
        []
      );
      
      res.json({
        growth: result.rows,
        totals: totals.rows[0],
        start_date,
        end_date
      });
      
    } catch (error) {
      logger.error('Get users report error:', error);
      res.status(500).json({ error: 'Failed to get users report' });
    }
  }

  /**
   * Get pharmacy report
   * GET /api/admin/reports/pharmacy
   */
  async getPharmacyReport(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      let dateCondition = '';
      const params = [];
      let paramIndex = 1;
      
      if (start_date && end_date) {
        dateCondition = `AND o.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(start_date, end_date);
        paramIndex += 2;
      }
      
      // Order statistics
      const orders = await query(
        `SELECT 
           COUNT(*) as total_orders,
           COUNT(CASE WHEN o.order_type = 'prescription' THEN 1 END) as prescription_orders,
           COUNT(CASE WHEN o.order_type = 'over_the_counter' THEN 1 END) as otc_orders,
           SUM(o.total_amount) as total_revenue,
           AVG(o.total_amount) as avg_order_value
         FROM orders o
         WHERE o.status != 'cancelled' ${dateCondition}`,
        params
      );
      
      // Top selling medications
      const topMedications = await query(
        `SELECT 
           m.name,
           SUM(oi.quantity) as units_sold,
           SUM(oi.quantity * oi.price) as revenue
         FROM order_items oi
         JOIN medications m ON oi.medication_id = m.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status != 'cancelled' ${dateCondition}
         GROUP BY m.id, m.name
         ORDER BY units_sold DESC
         LIMIT 10`,
        params
      );
      
      res.json({
        summary: orders.rows[0],
        topMedications: topMedications.rows,
        start_date,
        end_date
      });
      
    } catch (error) {
      logger.error('Get pharmacy report error:', error);
      res.status(500).json({ error: 'Failed to get pharmacy report' });
    }
  }

  /**
   * Export report
   * GET /api/admin/reports/export/:format
   */
  async exportReport(req, res) {
    try {
      const { format } = req.params;
      const { type, start_date, end_date } = req.query;
      
      // Fetch data based on type
      let data;
      switch(type) {
        case 'revenue':
          data = await this.getRevenueData(req);
          break;
        case 'appointments':
          data = await this.getAppointmentsReport(req);
          break;
        case 'users':
          data = await this.getUsersReport(req);
          break;
        case 'pharmacy':
          data = await this.getPharmacyReport(req);
          break;
        default:
          return res.status(400).json({ error: 'Invalid report type' });
      }
      
      // Format based on export type
      if (format === 'pdf') {
        // Generate PDF (implementation depends on PDF library)
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${start_date}_${end_date}.pdf`);
        // Send PDF buffer
      } else if (format === 'excel') {
        // Generate Excel (implementation depends on Excel library)
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=report_${type}_${start_date}_${end_date}.xlsx`);
        // Send Excel buffer
      } else {
        res.status(400).json({ error: 'Invalid export format' });
      }
      
    } catch (error) {
      logger.error('Export report error:', error);
      res.status(500).json({ error: 'Failed to export report' });
    }
  }

  /**
   * Get system settings
   * GET /api/admin/settings
   */
  async getSettings(req, res) {
    try {
      const result = await query(
        'SELECT * FROM system_settings ORDER BY key ASC',
        []
      );
      
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      res.json({ settings });
      
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  }

  /**
   * Update system settings
   * PUT /api/admin/settings
   */
  async updateSettings(req, res) {
    try {
      const settings = req.body;
      
      for (const [key, value] of Object.entries(settings)) {
        await query(
          `INSERT INTO system_settings (key, value, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, value]
        );
      }
      
      logger.info(`System settings updated by admin ${req.user.id}`);
      
      res.json({ message: 'Settings updated successfully' });
      
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}

module.exports = new AdminController();