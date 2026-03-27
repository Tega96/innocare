// backend/src/routes/videoRoutes.js
const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validation');

const tokenValidation = [
  body('appointmentId').isUUID().withMessage('Valid appointment ID required'),
  body('userId').isUUID().withMessage('Valid user ID required'),
  body('role').optional().isIn(['publisher', 'subscriber'])
];

router.use(authenticateToken);

router.post('/token', tokenValidation, validate, videoController.generateToken);
router.post('/call/:appointmentId/start', videoController.startCall);
router.post('/call/:appointmentId/end', videoController.endCall);
router.post('/recording/start', videoController.startRecording);
router.post('/recording/stop', videoController.stopRecording);
router.get('/recordings/:appointmentId', videoController.getRecordings);
router.get('/recordings/:id/download', videoController.downloadRecording);

module.exports = router;