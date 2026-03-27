// backend/src/controllers/videoController.js
const videoService = require('../services/videoService');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class VideoController {
  /**
   * Generate Agora token for video call
   * POST /api/video/token
   */
  async generateToken(req, res) {
    try {
      const { appointmentId, userId, role } = req.body;
      
      // Validate user can join this call
      const validation = await videoService.validateCallParticipation(appointmentId, userId);
      
      if (!validation.success) {
        return res.status(403).json({ error: validation.error });
      }
      
      // Create channel name
      const channelName = videoService.createChannelName(appointmentId);
      const uid = parseInt(userId.slice(0, 8), 16) || Math.floor(Math.random() * 1000000);
      
      // Generate token
      const tokenResult = videoService.generateToken(channelName, uid, role || 'publisher');
      
      if (!tokenResult.success) {
        return res.status(500).json({ error: tokenResult.error });
      }
      
      // Log call start
      await videoService.logCallStart(appointmentId, userId, channelName);
      
      res.json({
        success: true,
        token: tokenResult.token,
        appId: tokenResult.appId,
        channelName,
        uid,
        expiresAt: tokenResult.expiresAt
      });
      
    } catch (error) {
      logger.error('Generate token error:', error);
      res.status(500).json({ error: 'Failed to generate token' });
    }
  }

  /**
   * Start video call
   * POST /api/video/call/:appointmentId/start
   */
  async startCall(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.id;
      
      const validation = await videoService.validateCallParticipation(appointmentId, userId);
      
      if (!validation.success) {
        return res.status(403).json({ error: validation.error });
      }
      
      const channelName = videoService.createChannelName(appointmentId);
      
      res.json({
        success: true,
        channelName,
        message: 'Call started'
      });
      
    } catch (error) {
      logger.error('Start call error:', error);
      res.status(500).json({ error: 'Failed to start call' });
    }
  }

  /**
   * End video call
   * POST /api/video/call/:appointmentId/end
   */
  async endCall(req, res) {
    try {
      const { appointmentId } = req.params;
      const { duration } = req.body;
      const userId = req.user.id;
      
      const result = await videoService.logCallEnd(appointmentId, userId, duration);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Call ended successfully'
        });
      } else {
        res.status(400).json({ error: result.error });
      }
      
    } catch (error) {
      logger.error('End call error:', error);
      res.status(500).json({ error: 'Failed to end call' });
    }
  }

  /**
   * Start recording
   * POST /api/video/recording/start
   */
  async startRecording(req, res) {
    try {
      const { appointmentId } = req.body;
      const userId = req.user.id;
      
      const result = await videoService.startRecording(appointmentId, userId);
      
      if (result.success) {
        res.json({
          success: true,
          recordingId: result.recordingId,
          message: result.message
        });
      } else {
        res.status(400).json({ error: result.error });
      }
      
    } catch (error) {
      logger.error('Start recording error:', error);
      res.status(500).json({ error: 'Failed to start recording' });
    }
  }

  /**
   * Stop recording
   * POST /api/video/recording/stop
   */
  async stopRecording(req, res) {
    try {
      const { appointmentId } = req.body;
      const userId = req.user.id;
      
      const result = await videoService.stopRecording(appointmentId, userId);
      
      if (result.success) {
        res.json({
          success: true,
          recording: result.recording,
          message: result.message
        });
      } else {
        res.status(400).json({ error: result.error });
      }
      
    } catch (error) {
      logger.error('Stop recording error:', error);
      res.status(500).json({ error: 'Failed to stop recording' });
    }
  }

  /**
   * Get recordings for appointment
   * GET /api/video/recordings/:appointmentId
   */
  async getRecordings(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.id;
      
      const result = await videoService.getRecordings(appointmentId, userId);
      
      if (result.success) {
        res.json({
          success: true,
          recordings: result.recordings
        });
      } else {
        res.status(403).json({ error: result.error });
      }
      
    } catch (error) {
      logger.error('Get recordings error:', error);
      res.status(500).json({ error: 'Failed to get recordings' });
    }
  }

  /**
   * Get call status
   * GET /api/video/call/:appointmentId/status
   */
  async getCallStatus(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.id;
      
      const result = await videoService.getCallStatus(appointmentId, userId);
      
      if (result.success) {
        res.json({
          success: true,
          status: result.status,
          startedAt: result.startedAt,
          duration: result.duration,
          channelName: result.channelName
        });
      } else {
        res.status(404).json({ error: result.error });
      }
      
    } catch (error) {
      logger.error('Get call status error:', error);
      res.status(500).json({ error: 'Failed to get call status' });
    }
  }

  /**
   * Download recording
   * GET /api/video/recordings/:id/download
   */
  async downloadRecording(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get recording details
      const recording = await query(
        `SELECT vr.*, a.id as appointment_id,
                d.user_id as doctor_user_id,
                p.user_id as patient_user_id
         FROM video_recordings vr
         JOIN appointments a ON vr.appointment_id = a.id
         JOIN doctors d ON a.doctor_id = d.id
         JOIN patients p ON a.patient_id = p.id
         WHERE vr.id = $1`,
        [id]
      );
      
      if (recording.rows.length === 0) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      const record = recording.rows[0];
      
      // Verify user has access
      if (userId !== record.doctor_user_id && userId !== record.patient_user_id) {
        return res.status(403).json({ error: 'Not authorized to download this recording' });
      }
      
      if (!record.recording_url) {
        return res.status(404).json({ error: 'Recording file not found' });
      }
      
      // Redirect to recording URL or proxy download
      res.json({
        success: true,
        downloadUrl: record.recording_url
      });
      
    } catch (error) {
      logger.error('Download recording error:', error);
      res.status(500).json({ error: 'Failed to download recording' });
    }
  }
}

module.exports = new VideoController();