// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const healthRoutes = require('./healthRoutes');
const pharmacyRoutes = require('./pharmacyRoutes');
const paymentRoutes = require('./paymentRoutes');
const chatRoutes = require('./chatRoutes');
const videoRoutes = require('./videoRoutes');
const adminRoutes = require('./adminRoutes');
const uploadRoutes = require('./uploadRoutes');

// Register all routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/health', healthRoutes);
router.use('/pharmacy', pharmacyRoutes);
router.use('/payments', paymentRoutes);
router.use('/chat', chatRoutes);
router.use('/video', videoRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;