// backend/src/services/videoService.js
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger');

class VideoService {
  constructor() {
    this.appId = process.env.AGORA_APP_ID;
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE;
    this.recordingServer = process.env.AGORA_RECORDING_SERVER || 'https://api.agora.io/v1/apps';
  }

  /**
   * Generate Agora token for video call
   */
  generateToken(channelName, uid, role = 'publisher') {
    try {
      if (!this.appId || !this.appCertificate) {
        throw new Error('Agora credentials not configured');
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + 3600; // Token valid for 1 hour
      
      let rtcRole;
      switch(role) {
        case 'publisher':
          rtcRole = RtcRole.PUBLISHER;
          break;
        case 'subscriber':
          rtcRole = RtcRole.SUBSCRIBER;
          break;
        default:
          rtcRole = RtcRole.PUBLISHER;
      }
      
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpiredTs
      );
      
      return {
        success: true,
        token,
        appId: this.appId,
        channelName,
        uid,
        expiresAt: privilegeExpiredTs
      };
      
    } catch (error) {
      logger.error('Token generation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start video call recording
   */
  async startRecording(appointmentId, userId) {
    try {
      // Check if recording already exists
      const existing = await query(
        'SELECT * FROM video_recordings WHERE appointment_id = $1 AND status = $2',
        [appointmentId, 'recording']
      );
      
      if (existing.rows.length > 0) {
        return { success: false, error: 'Recording already in progress' };
      }
      
      // Get appointment details
      const appointment = await query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                p.user_id as patient_user_id
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN patients p ON a.patient_id = p.id
         WHERE a.id = $1`,
        [appointmentId]
      );
      
      if (appointment.rows.length === 0) {
        return { success: false, error: 'Appointment not found' };
      }
      
      const apt = appointment.rows[0];
      
      // Verify user is part of the appointment
      if (userId !== apt.doctor_user_id && userId !== apt.patient_user_id) {
        return { success: false, error: 'Not authorized to record this call' };
      }
      
      // Create recording record
      const recording = await query(
        `INSERT INTO video_recordings 
         (id, appointment_id, user_id, status, started_at, recording_consent)
         VALUES (gen_random_uuid(), $1, $2, 'recording', NOW(), $3)
         RETURNING *`,
        [appointmentId, userId, apt.recording_consent]
      );
      
      logger.info(`Recording started for appointment ${appointmentId} by user ${userId}`);
      
      return {
        success: true,
        recordingId: recording.rows[0].id,
        message: 'Recording started'
      };
      
    } catch (error) {
      logger.error('Start recording error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop video call recording
   */
  async stopRecording(appointmentId, userId) {
    try {
      // Update recording record
      const recording = await query(
        `UPDATE video_recordings 
         SET status = 'stopped', 
             ended_at = NOW(),
             duration = EXTRACT(EPOCH FROM (NOW() - started_at))
         WHERE appointment_id = $1 AND status = 'recording'
         RETURNING *`,
        [appointmentId]
      );
      
      if (recording.rows.length === 0) {
        return { success: false, error: 'No active recording found' };
      }
      
      logger.info(`Recording stopped for appointment ${appointmentId}`);
      
      return {
        success: true,
        recording: recording.rows[0],
        message: 'Recording stopped'
      };
      
    } catch (error) {
      logger.error('Stop recording error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save recording URL after processing
   */
  async saveRecordingUrl(recordingId, recordingUrl, duration, fileSize) {
    try {
      const result = await query(
        `UPDATE video_recordings 
         SET recording_url = $1, 
             duration = $2, 
             file_size = $3,
             status = 'completed',
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [recordingUrl, duration, fileSize, recordingId]
      );
      
      return { success: true, recording: result.rows[0] };
      
    } catch (error) {
      logger.error('Save recording URL error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recordings for appointment
   */
  async getRecordings(appointmentId, userId) {
    try {
      // Verify user is authorized to view recordings
      const appointment = await query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                p.user_id as patient_user_id
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN patients p ON a.patient_id = p.id
         WHERE a.id = $1`,
        [appointmentId]
      );
      
      if (appointment.rows.length === 0) {
        return { success: false, error: 'Appointment not found' };
      }
      
      const apt = appointment.rows[0];
      
      if (userId !== apt.doctor_user_id && userId !== apt.patient_user_id) {
        return { success: false, error: 'Not authorized to view these recordings' };
      }
      
      const recordings = await query(
        `SELECT id, recording_url, duration, file_size, status, started_at, ended_at, created_at
         FROM video_recordings
         WHERE appointment_id = $1 AND status IN ('completed', 'stopped')
         ORDER BY created_at DESC`,
        [appointmentId]
      );
      
      return { success: true, recordings: recordings.rows };
      
    } catch (error) {
      logger.error('Get recordings error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a unique channel name for the appointment
   */
  createChannelName(appointmentId) {
    return `maternitycare_${appointmentId}_${Date.now()}`;
  }

  /**
   * Validate call participation
   */
  async validateCallParticipation(appointmentId, userId) {
    try {
      const result = await query(
        `SELECT a.*, 
                d.user_id as doctor_user_id,
                p.user_id as patient_user_id,
                a.status as appointment_status
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.id
         JOIN patients p ON a.patient_id = p.id
         WHERE a.id = $1`,
        [appointmentId]
      );
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Appointment not found' };
      }
      
      const apt = result.rows[0];
      
      // Check if user is part of the appointment
      if (userId !== apt.doctor_user_id && userId !== apt.patient_user_id) {
        return { success: false, error: 'Not authorized to join this call' };
      }
      
      // Check if appointment is confirmed
      if (apt.appointment_status !== 'confirmed') {
        return { success: false, error: 'Appointment is not confirmed' };
      }
      
      // Check if appointment time is within 15 minutes of scheduled time
      const appointmentTime = new Date(`${apt.appointment_date} ${apt.start_time}`);
      const now = new Date();
      const diffMinutes = (appointmentTime - now) / 1000 / 60;
      
      if (Math.abs(diffMinutes) > 30) {
        return { success: false, error: 'Call can only be started 30 minutes before or after scheduled time' };
      }
      
      return {
        success: true,
        appointment: apt,
        role: userId === apt.doctor_user_id ? 'doctor' : 'patient'
      };
      
    } catch (error) {
      logger.error('Validate call participation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log call start
   */
  async logCallStart(appointmentId, userId, channelName) {
    try {
      await query(
        `UPDATE appointments 
         SET video_call_link = $1,
             call_started_at = NOW(),
             call_status = 'active',
             updated_at = NOW()
         WHERE id = $2`,
        [channelName, appointmentId]
      );
      
      logger.info(`Video call started for appointment ${appointmentId} by user ${userId}`);
      
      return { success: true };
      
    } catch (error) {
      logger.error('Log call start error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log call end
   */
  async logCallEnd(appointmentId, userId, duration) {
    try {
      await query(
        `UPDATE appointments 
         SET call_ended_at = NOW(),
             call_duration = $1,
             call_status = 'ended',
             updated_at = NOW()
         WHERE id = $2`,
        [duration, appointmentId]
      );
      
      logger.info(`Video call ended for appointment ${appointmentId} after ${duration} seconds`);
      
      return { success: true };
      
    } catch (error) {
      logger.error('Log call end error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active call status
   */
  async getCallStatus(appointmentId, userId) {
    try {
      const result = await query(
        `SELECT call_status, call_started_at, call_duration, video_call_link
         FROM appointments
         WHERE id = $1`,
        [appointmentId]
      );
      
      if (result.rows.length === 0) {
        return { success: false, error: 'Appointment not found' };
      }
      
      return {
        success: true,
        status: result.rows[0].call_status || 'inactive',
        startedAt: result.rows[0].call_started_at,
        duration: result.rows[0].call_duration,
        channelName: result.rows[0].video_call_link
      };
      
    } catch (error) {
      logger.error('Get call status error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up stale calls (runs as cron job)
   */
  async cleanupStaleCalls() {
    try {
      // Find calls that have been active for more than 2 hours
      const result = await query(
        `UPDATE appointments 
         SET call_status = 'ended',
             call_ended_at = NOW(),
             call_duration = EXTRACT(EPOCH FROM (NOW() - call_started_at))
         WHERE call_status = 'active'
           AND call_started_at < NOW() - INTERVAL '2 hours'
         RETURNING id, call_duration`
      );
      
      if (result.rows.length > 0) {
        logger.info(`Cleaned up ${result.rows.length} stale video calls`);
      }
      
      return { success: true, cleaned: result.rows.length };
      
    } catch (error) {
      logger.error('Cleanup stale calls error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new VideoService();