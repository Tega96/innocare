// backend/src/models/InventoryTransaction.js
const { query } = require('../config/database');

class InventoryTransaction {
  constructor() {
    this.tableName = 'inventory_transactions';
  }

  /**
   * Create transaction
   */
  async create(transactionData) {
    const {
      medication_id, transaction_type, quantity, reference_id, notes
    } = transactionData;
    
    const result = await query(
      `INSERT INTO inventory_transactions 
       (id, medication_id, transaction_type, quantity, reference_id, notes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [medication_id, transaction_type, quantity, reference_id, notes]
    );
    
    return result.rows[0];
  }

  /**
   * Get transactions by medication
   */
  async getByMedication(medicationId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const result = await query(
      `SELECT * FROM inventory_transactions
       WHERE medication_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [medicationId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(startDate, endDate, options = {}) {
    const { transaction_type, limit = 100, offset = 0 } = options;
    
    let sql = `
      SELECT it.*, m.name as medication_name
      FROM inventory_transactions it
      JOIN medications m ON it.medication_id = m.id
      WHERE it.created_at BETWEEN $1 AND $2
    `;
    const params = [startDate, endDate];
    let paramIndex = 3;
    
    if (transaction_type) {
      sql += ` AND it.transaction_type = $${paramIndex}`;
      params.push(transaction_type);
      paramIndex++;
    }
    
    sql += ` ORDER BY it.created_at DESC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get transaction summary
   */
  async getSummary(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(quantity) as total_quantity
      FROM inventory_transactions
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    sql += ` GROUP BY transaction_type`;
    
    const result = await query(sql, params);
    
    const summary = {};
    result.rows.forEach(row => {
      summary[row.transaction_type] = {
        count: parseInt(row.transaction_count),
        quantity: parseInt(row.total_quantity)
      };
    });
    
    return summary;
  }

  /**
   * Get daily transaction summary
   */
  async getDailySummary(days = 30) {
    const result = await query(
      `SELECT 
         DATE(created_at) as date,
         transaction_type,
         SUM(quantity) as total_quantity,
         COUNT(*) as transaction_count
       FROM inventory_transactions
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at), transaction_type
       ORDER BY date ASC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Get recent transactions
   */
  async getRecent(limit = 20) {
    const result = await query(
      `SELECT it.*, m.name as medication_name
       FROM inventory_transactions it
       JOIN medications m ON it.medication_id = m.id
       ORDER BY it.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = new InventoryTransaction();