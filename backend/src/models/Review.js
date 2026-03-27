// backend/src/models/Review.js
const { query } = require('../config/database');

class Review {
  constructor() {
    this.tableName = 'doctor_reviews';
  }

  /**
   * Create review
   */
  async create(reviewData) {
    const {
      doctor_id, patient_id, appointment_id, rating, comment
    } = reviewData;
    
    const result = await query(
      `INSERT INTO doctor_reviews 
       (id, doctor_id, patient_id, appointment_id, rating, comment)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       ON CONFLICT (doctor_id, patient_id, appointment_id) 
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING *`,
      [doctor_id, patient_id, appointment_id, rating, comment]
    );
    
    // Update doctor's average rating
    await this.updateDoctorRating(doctor_id);
    
    return result.rows[0];
  }

  /**
   * Update doctor's average rating
   */
  async updateDoctorRating(doctorId) {
    const result = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM doctor_reviews
       WHERE doctor_id = $1`,
      [doctorId]
    );
    
    const avgRating = parseFloat(result.rows[0].avg_rating) || 0;
    const totalReviews = parseInt(result.rows[0].total_reviews) || 0;
    
    await query(
      `UPDATE doctors 
       SET rating = $1, total_reviews = $2, updated_at = NOW()
       WHERE id = $3`,
      [avgRating, totalReviews, doctorId]
    );
    
    return { avgRating, totalReviews };
  }

  /**
   * Get reviews by doctor
   */
  async getByDoctor(doctorId, options = {}) {
    const { limit = 20, offset = 0 } = options;
    
    const result = await query(
      `SELECT r.*, 
              p.first_name as patient_first_name,
              p.last_name as patient_last_name,
              a.appointment_date
       FROM doctor_reviews r
       JOIN patients p ON r.patient_id = p.id
       LEFT JOIN appointments a ON r.appointment_id = a.id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, limit, offset]
    );
    
    return result.rows;
  }

  /**
   * Get review by appointment
   */
  async getByAppointment(appointmentId) {
    const result = await query(
      'SELECT * FROM doctor_reviews WHERE appointment_id = $1',
      [appointmentId]
    );
    return result.rows[0];
  }

  /**
   * Get review statistics
   */
  async getStats(doctorId) {
    const result = await query(
      `SELECT 
         COUNT(*) as total_reviews,
         AVG(rating) as avg_rating,
         COUNT(CASE WHEN rating >= 4.5 THEN 1 END) as excellent,
         COUNT(CASE WHEN rating >= 4.0 AND rating < 4.5 THEN 1 END) as good,
         COUNT(CASE WHEN rating >= 3.0 AND rating < 4.0 THEN 1 END) as average,
         COUNT(CASE WHEN rating < 3.0 THEN 1 END) as poor
       FROM doctor_reviews
       WHERE doctor_id = $1`,
      [doctorId]
    );
    return result.rows[0];
  }

  /**
   * Delete review
   */
  async delete(id, doctorId) {
    const result = await query(
      'DELETE FROM doctor_reviews WHERE id = $1 AND doctor_id = $2 RETURNING id',
      [id, doctorId]
    );
    
    if (result.rows[0]) {
      await this.updateDoctorRating(doctorId);
    }
    
    return result.rows[0];
  }
}

module.exports = new Review();