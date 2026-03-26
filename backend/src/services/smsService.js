const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  async sendVerificationCode(phoneNumber, code) {
    if (!this.client) {
      console.log(`[SMS Mock] Verification code for ${phoneNumber}: ${code}`);
      return { success: true, mock: true };
    }

    try {
      const message = await this.client.messages.create({
        body: `Welcome to MaternityCare! Your verification code is: ${code}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendAppointmentReminder(phoneNumber, appointmentDetails) {
    if (!this.client) {
      console.log(`[SMS Mock] Appointment reminder for ${phoneNumber}: ${appointmentDetails.date} at ${appointmentDetails.time}`);
      return { success: true, mock: true };
    }

    try {
      const message = await this.client.messages.create({
        body: `Reminder: You have an appointment with Dr. ${appointmentDetails.doctorName} on ${appointmentDetails.date} at ${appointmentDetails.time}. Please arrive 10 minutes early.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('SMS reminder error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SMSService();