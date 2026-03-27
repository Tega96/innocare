// backend/src/models/SystemSettings.js
const { query } = require('../config/database');

class SystemSettings {
  constructor() {
    this.tableName = 'system_settings';
  }

  /**
   * Get setting
   */
  async get(key) {
    const result = await query(
      'SELECT * FROM system_settings WHERE key = $1',
      [key]
    );
    return result.rows[0];
  }

  /**
   * Set setting
   */
  async set(key, value) {
    const result = await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = NOW()
       RETURNING *`,
      [key, value]
    );
    return result.rows[0];
  }

  /**
   * Get all settings
   */
  async getAll() {
    const result = await query(
      'SELECT * FROM system_settings ORDER BY key ASC',
      []
    );
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return settings;
  }

  /**
   * Delete setting
   */
  async delete(key) {
    const result = await query(
      'DELETE FROM system_settings WHERE key = $1 RETURNING key',
      [key]
    );
    return result.rows[0];
  }

  /**
   * Get settings by category
   */
  async getByCategory(category) {
    const result = await query(
      'SELECT * FROM system_settings WHERE key LIKE $1 ORDER BY key ASC',
      [`${category}_%`]
    );
    
    const settings = {};
    result.rows.forEach(row => {
      const settingKey = row.key.replace(`${category}_`, '');
      settings[settingKey] = row.value;
    });
    
    return settings;
  }

  /**
   * Update multiple settings
   */
  async updateMultiple(settings) {
    const results = [];
    for (const [key, value] of Object.entries(settings)) {
      const result = await this.set(key, value);
      results.push(result);
    }
    return results;
  }

  /**
   * Get platform fee percentage
   */
  async getPlatformFee() {
    const setting = await this.get('platform_fee_percentage');
    return setting ? parseFloat(setting.value) : 10; // Default 10%
  }

  /**
   * Get minimum withdrawal amount
   */
  async getMinWithdrawal() {
    const setting = await this.get('min_withdrawal_amount');
    return setting ? parseFloat(setting.value) : 10000; // Default ₦10,000
  }

  /**
   * Get appointment cancellation hours
   */
  async getCancellationHours() {
    const setting = await this.get('cancellation_hours');
    return setting ? parseInt(setting.value) : 24; // Default 24 hours
  }

  /**
   * Get maintenance mode status
   */
  async getMaintenanceMode() {
    const setting = await this.get('maintenance_mode');
    return setting ? setting.value === 'true' : false;
  }

  /**
   * Set maintenance mode
   */
  async setMaintenanceMode(enabled, message = null) {
    await this.set('maintenance_mode', enabled.toString());
    if (message) {
      await this.set('maintenance_message', message);
    }
  }

  /**
   * Get email settings
   */
  async getEmailSettings() {
    return await this.getByCategory('email');
  }

  /**
   * Get SMS settings
   */
  async getSMSSettings() {
    return await this.getByCategory('sms');
  }

  /**
   * Get payment settings
   */
  async getPaymentSettings() {
    return await this.getByCategory('payment');
  }
}

module.exports = new SystemSettings();