// backend/src/models/index.js
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const HealthRecord = require('./HealthRecord');
const MedicalRecord = require('./MedicalRecord');
const Medication = require('./Medication');
const Order = require('./Order');
const Prescription = require('./Prescription');
const ChatMessage = require('./ChatMessage');
const Payment = require('./Payment');
const Review = require('./Review');
const Notification = require('./Notification');
const DoctorEarnings = require('./DoctorEarnings');
const Withdrawal = require('./Withdrawal');
const InventoryTransaction = require('./InventoryTransaction');
const VideoRecording = require('./VideoRecording');
const SystemSettings = require('./SystemSettings');

module.exports = {
  User,
  Patient,
  Doctor,
  Appointment,
  HealthRecord,
  MedicalRecord,
  Medication,
  Order,
  Prescription,
  ChatMessage,
  Payment,
  Review,
  Notification,
  DoctorEarnings,
  Withdrawal,
  InventoryTransaction,
  VideoRecording,
  SystemSettings
};