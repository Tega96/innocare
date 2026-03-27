// backend/src/controllers/pharmacyController.js
const { query } = require('../config/database');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

class PharmacyController {
  /**
   * Get all medications with pagination and filters
   * GET /api/pharmacy/medications
   */
  async getMedications(req, res) {
    try {
      const { 
        category, 
        search, 
        requires_prescription,
        page = 1, 
        limit = 20 
      } = req.query;
      
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
      
      if (search) {
        sql += ` AND (m.name ILIKE $${paramIndex} OR m.generic_name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (requires_prescription !== undefined) {
        sql += ` AND m.requires_prescription = $${paramIndex}`;
        params.push(requires_prescription === 'true');
        paramIndex++;
      }
      
      sql += ` ORDER BY m.name ASC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM medications m WHERE m.stock_quantity >= 0`,
        []
      );
      
      res.json({
        medications: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      });
      
    } catch (error) {
      logger.error('Get medications error:', error);
      res.status(500).json({ error: 'Failed to get medications' });
    }
  }

  /**
   * Get single medication details
   * GET /api/pharmacy/medications/:id
   */
  async getMedicationDetails(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        'SELECT * FROM medications WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get medication details error:', error);
      res.status(500).json({ error: 'Failed to get medication details' });
    }
  }

  /**
   * Get medication categories
   * GET /api/pharmacy/categories
   */
  async getCategories(req, res) {
    try {
      const result = await query(
        'SELECT DISTINCT category FROM medications WHERE category IS NOT NULL ORDER BY category',
        []
      );
      
      res.json({ categories: result.rows.map(r => r.category) });
      
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to get categories' });
    }
  }

  /**
   * Get user's prescriptions
   * GET /api/pharmacy/prescriptions
   */
  async getPrescriptions(req, res) {
    try {
      const { status = 'active' } = req.query;
      
      const result = await query(
        `SELECT p.*, 
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                array_agg(
                  json_build_object(
                    'id', pi.id,
                    'medication_id', pi.medication_id,
                    'medication_name', m.name,
                    'dosage', pi.dosage,
                    'frequency', pi.frequency,
                    'duration_days', pi.duration_days,
                    'quantity', pi.quantity,
                    'instructions', pi.instructions,
                    'medication_price', m.price
                  )
                ) as items
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
         LEFT JOIN medications m ON pi.medication_id = m.id
         WHERE p.patient_id = (SELECT id FROM patients WHERE user_id = $1)
           AND p.status = $2
         GROUP BY p.id, d.first_name, d.last_name
         ORDER BY p.issued_date DESC`,
        [req.user.id, status]
      );
      
      res.json({ prescriptions: result.rows });
      
    } catch (error) {
      logger.error('Get prescriptions error:', error);
      res.status(500).json({ error: 'Failed to get prescriptions' });
    }
  }

  /**
   * Get single prescription details
   * GET /api/pharmacy/prescriptions/:id
   */
  async getPrescriptionDetails(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT p.*, 
                d.first_name as doctor_first_name,
                d.last_name as doctor_last_name,
                array_agg(
                  json_build_object(
                    'id', pi.id,
                    'medication_id', pi.medication_id,
                    'medication_name', m.name,
                    'dosage', pi.dosage,
                    'frequency', pi.frequency,
                    'duration_days', pi.duration_days,
                    'quantity', pi.quantity,
                    'instructions', pi.instructions,
                    'medication_price', m.price
                  )
                ) as items
         FROM prescriptions p
         JOIN doctors d ON p.doctor_id = d.id
         LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
         LEFT JOIN medications m ON pi.medication_id = m.id
         WHERE p.id = $1
           AND p.patient_id = (SELECT id FROM patients WHERE user_id = $2)
         GROUP BY p.id, d.first_name, d.last_name`,
        [id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Prescription not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get prescription details error:', error);
      res.status(500).json({ error: 'Failed to get prescription details' });
    }
  }

  /**
   * Order prescription
   * POST /api/pharmacy/prescriptions/:id/order
   */
  async orderPrescription(req, res) {
    try {
      const { id } = req.params;
      const { deliveryAddress } = req.body;
      
      // Get prescription details
      const prescription = await query(
        `SELECT p.*, 
                array_agg(
                  json_build_object(
                    'medication_id', pi.medication_id,
                    'quantity', pi.quantity,
                    'price', m.price
                  )
                ) as items
         FROM prescriptions p
         LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
         LEFT JOIN medications m ON pi.medication_id = m.id
         WHERE p.id = $1
           AND p.patient_id = (SELECT id FROM patients WHERE user_id = $2)
           AND p.status = 'active'
         GROUP BY p.id`,
        [id, req.user.id]
      );
      
      if (prescription.rows.length === 0) {
        return res.status(404).json({ error: 'Prescription not found or not active' });
      }
      
      const presc = prescription.rows[0];
      const items = presc.items || [];
      
      if (items.length === 0) {
        return res.status(400).json({ error: 'No items in prescription' });
      }
      
      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Create order
      const order = await query(
        `INSERT INTO orders 
         (patient_id, order_type, prescription_id, total_amount, delivery_address, status, payment_status)
         VALUES ($1, 'prescription', $2, $3, $4, 'pending', 'pending')
         RETURNING *`,
        [presc.patient_id, id, totalAmount, deliveryAddress]
      );
      
      // Add order items
      for (const item of items) {
        await query(
          `INSERT INTO order_items (order_id, medication_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.rows[0].id, item.medication_id, item.quantity, item.price]
        );
      }
      
      // Update prescription status
      await query(
        "UPDATE prescriptions SET status = 'dispensed' WHERE id = $1",
        [id]
      );
      
      logger.info(`Prescription order created: ${order.rows[0].id} for user ${req.user.id}`);
      
      // Initialize payment
      const payment = await paymentService.initializePayment({
        amount: totalAmount,
        userId: req.user.id,
        orderId: order.rows[0].id,
        paymentType: 'medication'
      });
      
      res.json({
        message: 'Order created successfully',
        order: order.rows[0],
        paymentUrl: payment.paymentUrl
      });
      
    } catch (error) {
      logger.error('Order prescription error:', error);
      res.status(500).json({ error: 'Failed to order prescription' });
    }
  }

  /**
   * Checkout (direct medication purchase without prescription)
   * POST /api/pharmacy/checkout
   */
  async checkout(req, res) {
    try {
      const { items, deliveryAddress } = req.body;
      
      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      
      // Get patient ID
      const patient = await query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.id]
      );
      
      if (patient.rows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      // Calculate total and verify items
      let totalAmount = 0;
      const verifiedItems = [];
      
      for (const item of items) {
        const medication = await query(
          'SELECT id, name, price, stock_quantity, requires_prescription FROM medications WHERE id = $1',
          [item.medicationId]
        );
        
        if (medication.rows.length === 0) {
          return res.status(400).json({ error: `Medication not found: ${item.medicationId}` });
        }
        
        const med = medication.rows[0];
        
        if (med.requires_prescription && !item.prescriptionId) {
          return res.status(400).json({ error: `${med.name} requires a prescription` });
        }
        
        if (med.stock_quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${med.name}` });
        }
        
        verifiedItems.push({
          medicationId: med.id,
          name: med.name,
          quantity: item.quantity,
          price: med.price
        });
        
        totalAmount += med.price * item.quantity;
      }
      
      // Create order
      const order = await query(
        `INSERT INTO orders 
         (patient_id, order_type, total_amount, delivery_address, status, payment_status)
         VALUES ($1, 'over_the_counter', $2, $3, 'pending', 'pending')
         RETURNING *`,
        [patient.rows[0].id, totalAmount, deliveryAddress]
      );
      
      // Add order items
      for (const item of verifiedItems) {
        await query(
          `INSERT INTO order_items (order_id, medication_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.rows[0].id, item.medicationId, item.quantity, item.price]
        );
      }
      
      logger.info(`Direct order created: ${order.rows[0].id} for user ${req.user.id}`);
      
      // Initialize payment
      const payment = await paymentService.initializePayment({
        amount: totalAmount,
        userId: req.user.id,
        orderId: order.rows[0].id,
        paymentType: 'medication'
      });
      
      res.json({
        message: 'Order created successfully',
        order: order.rows[0],
        paymentUrl: payment.paymentUrl
      });
      
    } catch (error) {
      logger.error('Checkout error:', error);
      res.status(500).json({ error: 'Failed to process checkout' });
    }
  }

  /**
   * Get user's orders
   * GET /api/pharmacy/orders
   */
  async getOrders(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      let sql = `
        SELECT o.*, 
               array_agg(
                 json_build_object(
                   'id', oi.id,
                   'medication_id', oi.medication_id,
                   'medication_name', m.name,
                   'quantity', oi.quantity,
                   'price', oi.price
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN medications m ON oi.medication_id = m.id
        WHERE o.patient_id = (SELECT id FROM patients WHERE user_id = $1)
      `;
      const params = [req.user.id];
      let paramIndex = 2;
      
      if (status) {
        sql += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      sql += ` GROUP BY o.id
               ORDER BY o.created_at DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), (page - 1) * limit);
      
      const result = await query(sql, params);
      
      res.json({
        orders: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      });
      
    } catch (error) {
      logger.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  }

  /**
   * Get single order details
   * GET /api/pharmacy/orders/:id
   */
  async getOrderDetails(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT o.*, 
                array_agg(
                  json_build_object(
                    'id', oi.id,
                    'medication_id', oi.medication_id,
                    'medication_name', m.name,
                    'quantity', oi.quantity,
                    'price', oi.price
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN medications m ON oi.medication_id = m.id
         WHERE o.id = $1
           AND o.patient_id = (SELECT id FROM patients WHERE user_id = $2)
         GROUP BY o.id`,
        [id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      res.json(result.rows[0]);
      
    } catch (error) {
      logger.error('Get order details error:', error);
      res.status(500).json({ error: 'Failed to get order details' });
    }
  }

  /**
   * Cancel order
   * PUT /api/pharmacy/orders/:id/cancel
   */
  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      
      const order = await query(
        `SELECT o.* FROM orders o
         WHERE o.id = $1
           AND o.patient_id = (SELECT id FROM patients WHERE user_id = $2)
           AND o.status IN ('pending', 'processing')`,
        [id, req.user.id]
      );
      
      if (order.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
      }
      
      await query(
        `UPDATE orders SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
      
      logger.info(`Order ${id} cancelled by user ${req.user.id}`);
      
      res.json({ message: 'Order cancelled successfully' });
      
    } catch (error) {
      logger.error('Cancel order error:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  }

  // Admin inventory management methods
  async getInventory(req, res) {
    try {
      const result = await query(
        `SELECT m.*, 
                COALESCE(SUM(it.quantity), 0) as total_sold
         FROM medications m
         LEFT JOIN inventory_transactions it ON m.id = it.medication_id AND it.transaction_type = 'sale'
         GROUP BY m.id
         ORDER BY m.name ASC`,
        []
      );
      
      res.json({ inventory: result.rows });
      
    } catch (error) {
      logger.error('Get inventory error:', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  }

  async addMedication(req, res) {
    try {
      const {
        name, generic_name, category, description, price,
        requires_prescription, stock_quantity, unit, manufacturer, expiry_date
      } = req.body;
      
      const result = await query(
        `INSERT INTO medications 
         (name, generic_name, category, description, price, requires_prescription,
          stock_quantity, unit, manufacturer, expiry_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [name, generic_name, category, description, price, requires_prescription,
         stock_quantity, unit, manufacturer, expiry_date]
      );
      
      logger.info(`New medication added: ${name}`);
      
      res.status(201).json({
        message: 'Medication added successfully',
        medication: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Add medication error:', error);
      res.status(500).json({ error: 'Failed to add medication' });
    }
  }

  async updateMedication(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const result = await query(
        `UPDATE medications 
         SET name = COALESCE($1, name),
             generic_name = COALESCE($2, generic_name),
             category = COALESCE($3, category),
             description = COALESCE($4, description),
             price = COALESCE($5, price),
             requires_prescription = COALESCE($6, requires_prescription),
             stock_quantity = COALESCE($7, stock_quantity),
             unit = COALESCE($8, unit),
             manufacturer = COALESCE($9, manufacturer),
             expiry_date = COALESCE($10, expiry_date),
             updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [updates.name, updates.generic_name, updates.category, updates.description,
         updates.price, updates.requires_prescription, updates.stock_quantity,
         updates.unit, updates.manufacturer, updates.expiry_date, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      logger.info(`Medication updated: ${id}`);
      
      res.json({
        message: 'Medication updated successfully',
        medication: result.rows[0]
      });
      
    } catch (error) {
      logger.error('Update medication error:', error);
      res.status(500).json({ error: 'Failed to update medication' });
    }
  }

  async deleteMedication(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        'DELETE FROM medications WHERE id = $1 RETURNING id',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      logger.info(`Medication deleted: ${id}`);
      
      res.json({ message: 'Medication deleted successfully' });
      
    } catch (error) {
      logger.error('Delete medication error:', error);
      res.status(500).json({ error: 'Failed to delete medication' });
    }
  }

  async adjustInventory(req, res) {
    try {
      const { medicationId, quantity, reason } = req.body;
      
      // Update stock
      const medication = await query(
        `UPDATE medications 
         SET stock_quantity = stock_quantity + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantity, medicationId]
      );
      
      if (medication.rows.length === 0) {
        return res.status(404).json({ error: 'Medication not found' });
      }
      
      // Record transaction
      await query(
        `INSERT INTO inventory_transactions 
         (medication_id, transaction_type, quantity, notes)
         VALUES ($1, 'adjustment', $2, $3)`,
        [medicationId, quantity, reason]
      );
      
      logger.info(`Inventory adjusted for medication ${medicationId}: ${quantity} units`);
      
      res.json({
        message: 'Inventory adjusted successfully',
        medication: medication.rows[0]
      });
      
    } catch (error) {
      logger.error('Adjust inventory error:', error);
      res.status(500).json({ error: 'Failed to adjust inventory' });
    }
  }
}

module.exports = new PharmacyController();