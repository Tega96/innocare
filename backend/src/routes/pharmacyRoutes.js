// backend/src/routes/pharmacyRoutes.js
const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const orderValidation = [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.medicationId').isUUID().withMessage('Valid medication ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Valid total amount required'),
  body('prescriptionId').optional().isUUID(),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
];

// Public routes (no authentication required for browsing)
router.get('/medications', pharmacyController.getMedications);
router.get('/medications/:id', pharmacyController.getMedicationDetails);
router.get('/categories', pharmacyController.getCategories);

// Protected routes
router.use(authenticateToken);

// Prescriptions
router.get('/prescriptions', pharmacyController.getPrescriptions);
router.get('/prescriptions/:id', pharmacyController.getPrescriptionDetails);
router.post('/prescriptions/:id/order', pharmacyController.orderPrescription);

// Orders
router.post('/checkout', orderValidation, validate, pharmacyController.checkout);
router.get('/orders', pharmacyController.getOrders);
router.get('/orders/:id', pharmacyController.getOrderDetails);
router.put('/orders/:id/cancel', pharmacyController.cancelOrder);

// Cart (if using server-side cart)
router.get('/cart', pharmacyController.getCart);
router.post('/cart', pharmacyController.addToCart);
router.put('/cart/:itemId', pharmacyController.updateCartItem);
router.delete('/cart/:itemId', pharmacyController.removeFromCart);

// Admin routes for inventory management
router.use('/admin', authorizeRole('admin'));
router.get('/admin/inventory', pharmacyController.getInventory);
router.post('/admin/medications', pharmacyController.addMedication);
router.put('/admin/medications/:id', pharmacyController.updateMedication);
router.delete('/admin/medications/:id', pharmacyController.deleteMedication);
router.post('/admin/inventory/adjust', pharmacyController.adjustInventory);

module.exports = router;