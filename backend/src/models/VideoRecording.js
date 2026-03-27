// backend/src/models/VideoRecording.js
const { query } = require('../config/database');

class VideoRecording {
  constructor() {
    this.tableName = 'video_recordings';
  }

  /**
   * Create recording record
   */
  async create(recordingData) {
    const {
      appointment_id, user_id, recording_consent, status
    } = recordingData;
    
    const result = await query(
      `INSERT INTO video_recordings 
       (id, appointment_id, user_id, recording_consent, status, started_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [appointment_id, user_id, recording_consent, status || 'recording']
    );
    
    return result.rows[0];
  }

  /**
   * Find recording by ID
   */
  async findById(id) {
    const result = await query(
      `SELECT vr.*, 
              a.appointment_date,
              a.start_time,
              d.first_name as doctor_first_name,
              d.last_name as doctor_last_name,
              p.first_name as patient_first_name,
              p.last_name as patient_last_name
       FROM video_recordings vr
       JOIN appointments a ON vr.appointment_id = a.id
       JOIN doctors d ON a.doctor_id = d.id
       JOIN patients p ON a.patient_id = p.id
       WHERE vr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get recordings by appointment
   */
  async getByAppointment(appointmentId) {
    const result = await query(
      `SELECT * FROM video_recordings
       WHERE appointment_id = $1
       ORDER BY created_at DESC`,
      [appointmentId]
    );
    return result.rows;
  }

  /**
   * Update recording status
   */
  async updateStatus(id, status, data = {}) {
    const fields = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let paramIndex = 2;
    
    if (data.recording_url) {
      fields.push(`recording_url = $${paramIndex}`);
      values.push(data.recording_url);
      paramIndex++;
    }
    
    if (data.duration) {
      fields.push(`duration = $${paramIndex}`);
      values.push(data.duration);
      paramIndex++;
    }
    
    if (data.file_size) {
      fields.push(`file_size = $${paramIndex}`);
      values.push(data.file_size);
      paramIndex++;
    }
    
    if (status === 'stopped' || status === 'completed') {
      fields.push(`ended_at = NOW()`);
    }
    
    values.push(id);
    
    const result = await query(
      `UPDATE video_recordings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Stop recording
   */
  async stopRecording(id) {
    const result = await query(
      `UPDATE video_recordings 
       SET status = 'stopped', 
           ended_at = NOW(),
           duration = EXTRACT(EPOCH FROM (NOW() - started_at)),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Get active recordings
   */
  async getActive() {
    const result = await query(
      `SELECT vr.*, 
              a.appointment_date,
              a.start_time
       FROM video_recordings vr
       JOIN appointments a ON vr.appointment_id = a.id
       WHERE vr.status = 'recording'
         AND vr.started_at < NOW() - INTERVAL '2 hours'`,
      []
    );
    return result.rows;
  }

  /**
   * Get recording statistics
   */
  async getStats(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_recordings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        SUM(duration) as total_duration,
        SUM(file_size) as total_size
      FROM video_recordings
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
    
    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Delete recording
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM video_recordings WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = new VideoRecording();