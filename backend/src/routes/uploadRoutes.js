// backend/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    if (file.fieldname === 'profile_image') folder += 'profiles/';
    else if (file.fieldname === 'medical_record') folder += 'medical_records/';
    else if (file.fieldname === 'prescription') folder += 'prescriptions/';
    else if (file.fieldname === 'chat_file') folder += 'chat/';
    else folder += 'misc/';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Protected routes
router.use(authenticateToken);

// Profile images
router.post('/profile-image', upload.single('profile_image'), uploadController.uploadProfileImage);

// Medical records
router.post('/medical-record', upload.single('medical_record'), uploadController.uploadMedicalRecord);

// Prescriptions
router.post('/prescription', upload.single('prescription'), uploadController.uploadPrescription);

// Chat files
router.post('/chat-file', upload.single('chat_file'), uploadController.uploadChatFile);

// Delete uploaded file
router.delete('/file/:filename', uploadController.deleteFile);

module.exports = router;