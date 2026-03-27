// backend/src/models/Medication.js
const { query } = require('../config/database');

class Medication {
  constructor() {
    this.tableName = 'medications';
  }

  /**
   * Create medication
   */
  async create(medicationData) {
    const {
      name, generic_name, category, description, price,
      requires_prescription, stock_quantity, unit, manufacturer, expiry_date
    } = medicationData;
    
    const result = await query(
      `INSERT INTO medications 
       (id, name, generic_name, category, description, price,
        requires_prescription, stock_quantity, unit, manufacturer, expiry_date)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, generic_name, category, description, price,
       requires_prescription, stock_quantity, unit, manufacturer, expiry_date]
    );
    
    return result.rows[0];
  }

  /**
   * Find medication by ID
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM medications WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Find medications by name (search)
   */
  async search(searchTerm, options = {}) {
    const { category, requires_prescription, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT * FROM medications
      WHERE (name ILIKE $1 OR generic_name ILIKE $1)
    `;
    const params = [`%${searchTerm}%`];
    let paramIndex = 2;
    
    if (category && category !== 'all') {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (requires_prescription !== undefined) {
      sql += ` AND requires_prescription = $${paramIndex}`;
      params.push(requires_prescription === 'true');
      paramIndex++;
    }
    
    sql += ` ORDER BY name ASC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    return result.rows;
  }

  /**
   * Get all medications with pagination
   */
  async getAll(options = {}) {
    const { category, requires_prescription, page = 1, limit = 20 } = options;
    
    let sql = `
      SELECT m.*,
             CASE WHEN m.stock_quantity > 0 THEN true ELSE false END as in_stock
      FROM medications m
      WHERE m.stock_quantity >= 0
    `;
    const params = [];
    let paramIndex = 1;
    
    if (category && category !== 'all') {
      sql += ` AND m.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (requires_prescription !== undefined) {
      sql += ` AND m.requires_prescription = $${paramIndex}`;
      params.push(requires_prescription === 'true');
      paramIndex++;
    }
    
    sql += ` ORDER BY m.name ASC
             LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, (page - 1) * limit);
    
    const result = await query(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) FROM medications WHERE stock_quantity >= 0';
    const countParams = [];
    if (category && category !== 'all') {
      countSql += ` AND category = $1`;
      countParams.push(category);
    }
    
    const countResult = await query(countSql, countParams);
    
    return {
      medications: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    };
  }

  /**
   * Update medication
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'name', 'generic_name', 'category', 'description', 'price',
      'requires_prescription', 'stock_quantity', 'unit', 'manufacturer', 'expiry_date'
    ];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (fields.length === 0) {
      return null;
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const result = await query(
      `UPDATE medications SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Update stock quantity
   */
  async updateStock(id, quantity, reason = null) {
    const result = await query(
      `UPDATE medications 
       SET stock_quantity = stock_quantity + $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    
    if (reason && result.rows[0]) {
      await query(
        `INSERT INTO inventory_transactions 
         (medication_id, transaction_type, quantity, notes)
         VALUES ($1, $2, $3, $4)`,
        [id, quantity > 0 ? 'restock' : 'sale', quantity, reason]
      );
    }
    
    return result.rows[0];
  }

  /**
   * Delete medication
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM medications WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get low stock medications
   */
  async getLowStock(threshold = 50) {
    const result = await query(
      `SELECT * FROM medications 
       WHERE stock_quantity <= $1 AND stock_quantity > 0
       ORDER BY stock_quantity ASC`,
      [threshold]
    );
    return result.rows;
  }

  /**
   * Get out of stock medications
   */
  async getOutOfStock() {
    const result = await query(
      `SELECT * FROM medications 
       WHERE stock_quantity = 0
       ORDER BY name ASC`,
      []
    );
    return result.rows;
  }

  /**
   * Get medications expiring soon
   */
  async getExpiringSoon(days = 90) {
    const result = await query(
      `SELECT * FROM medications 
       WHERE expiry_date IS NOT NULL
         AND expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
         AND expiry_date >= CURRENT_DATE
       ORDER BY expiry_date ASC`,
      [days]
    );
    return result.rows;
  }

  /**
   * Get medication categories
   */
  async getCategories() {
    const result = await query(
      'SELECT DISTINCT category FROM medications WHERE category IS NOT NULL ORDER BY category',
      []
    );
    return result.rows.map(r => r.category);
  }

  /**
   * Get inventory statistics
   */
  async getInventoryStats() {
    const result = await query(
      `SELECT 
         COUNT(*) as total_medications,
         SUM(stock_quantity) as total_units,
         COUNT(CASE WHEN stock_quantity <= 50 AND stock_quantity > 0 THEN 1 END) as low_stock,
         COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
         COUNT(CASE WHEN requires_prescription THEN 1 END) as prescription_only,
         AVG(price) as avg_price,
         SUM(stock_quantity * price) as total_value
       FROM medications`,
      []
    );
    return result.rows[0];
  }

  /**
   * Get sales statistics
   */
  async getSalesStats(days = 30) {
    const result = await query(
      `SELECT 
         m.id,
         m.name,
         COALESCE(SUM(oi.quantity), 0) as units_sold,
         COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
       FROM medications m
       LEFT JOIN order_items oi ON m.id = oi.medication_id
       LEFT JOIN orders o ON oi.order_id = o.id
       WHERE o.created_at >= NOW() - INTERVAL '1 day' * $1
          OR o.created_at IS NULL
       GROUP BY m.id, m.name
       ORDER BY units_sold DESC
       LIMIT 10`,
      [days]
    );
    return result.rows;
  }
}

module.exports = new Medication();