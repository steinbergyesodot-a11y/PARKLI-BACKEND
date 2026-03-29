import nodemailer from 'nodemailer';
import { logger } from './logger/logger';

interface emailData {
    firstName: string;
    email: string;
    address: string;
    gameDate: string;
    parkingTime: string;
    bookedAt?: Date | string;
    cancelBy?: Date | string;
    visitingTeam?: string;
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Build HTML email template
function buildBookingEmail(data: emailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed! ✓</h1>
          </div>

          <p>Hi ${data.firstName},</p>
          <p>Your parking space has been successfully booked for the game.</p>

          <div class="content">
            <h2>Booking Details</h2>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span>${data.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Game Date:</span>
              <span>${data.gameDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Parking Time:</span>
              <span>${data.parkingTime}</span>
            </div>
            ${data.visitingTeam ? `
            <div class="detail-row">
              <span class="detail-label">Team:</span>
              <span>${data.visitingTeam}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Booked At:</span>
              <span>${new Date(data.bookedAt || '').toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Cancellation Deadline:</span>
              <span>${new Date(data.cancelBy || '').toLocaleString()}</span>
            </div>
          </div>

          <p><strong>Cancellation Policy:</strong> You can cancel up to the deadline above.</p>

          <div class="footer">
            <p>Thank you for using PARKLI!</p>
            <p>&copy; 2026 PARKLI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendBookingNotification(data: emailData) {
  try {
    // Validate required environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      logger.warn({
        message: "Email service not configured. Skipping email notification.",
        email: data.email
      });
      return;
    }

    logger.info({
      message: "Sending booking notification",
      email: data.email,
      firstName: data.firstName,
      address: data.address,
      gameDate: data.gameDate,
      parkingTime: data.parkingTime,
      bookedAt: data.bookedAt,
      cancelBy: data.cancelBy
    });

    // Build email HTML
    const html = buildBookingEmail(data);

    // Send email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Booking Confirmed - PARKLI',
      html: html,
    });

    logger.info({
      message: "Booking notification sent successfully",
      email: data.email,
      messageId: result.messageId
    });

  } catch (error: any) {
    logger.error({
      message: "Error sending booking notification",
      error: error.message,
      email: data.email,
      stack: error.stack
    });
    // Don't throw - let booking succeed even if email fails
  }
}