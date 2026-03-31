import { Resend } from 'resend';
import { logger } from '../logger/logger';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

interface ownerEmailData {
    ownerName: string;
    ownerEmail: string;
    renterName: string;
    address: string;
    gameDate: string;
    parkingTime: string;
    bookedAt?: Date | string;
}

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
    if (!process.env.RESEND_API_KEY) {
      logger.warn({
        message: "Resend API key not configured. Skipping email notification.",
        email: data.email
      });
      return;
    }

    console.log("📧 Starting email send to:", data.email);
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
    console.log("📧 HTML built, now sending email...");

    // Send email via Resend
    console.log("📧 Calling resend.emails.send...");
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: data.email,
      subject: 'Booking Confirmed - PARKLI',
      html: html,
    });
    console.log("📧 resend.emails.send completed with result:", result);

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log("✅ Email sent successfully!");
    logger.info({
      message: "Booking notification sent successfully",
      email: data.email,
      messageId: result.data?.id
    });

  } catch (error: any) {
    console.log("❌ Email error:", error.message);
    logger.error({
      message: "Error sending booking notification",
      error: error.message,
      email: data.email,
      stack: error.stack
    });
    // Don't throw - let booking succeed even if email fails
  }
}

// Build HTML email template for owner
function buildOwnerBookingEmail(data: ownerEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Booking! 🎉</h1>
          </div>

          <p>Hi ${data.ownerName},</p>
          <p>You have a new booking for your parking space!</p>

          <div class="content">
            <h2>Booking Details</h2>
            <div class="detail-row">
              <span class="detail-label">Renter:</span>
              <span>${data.renterName}</span>
            </div>
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
            <div class="detail-row">
              <span class="detail-label">Booked At:</span>
              <span>${new Date(data.bookedAt || '').toLocaleString()}</span>
            </div>
          </div>

          <p><strong>Note:</strong> The renter can cancel up to 24 hours before the parking time.</p>

          <div class="footer">
            <p>Thank you for using PARKLI!</p>
            <p>&copy; 2026 PARKLI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendOwnerBookingNotification(data: ownerEmailData) {
  try {
    // Validate required environment variables
    if (!process.env.RESEND_API_KEY) {
      logger.warn({
        message: "Resend API key not configured. Skipping owner notification.",
        ownerEmail: data.ownerEmail
      });
      return;
    }

    console.log("📧 Starting owner notification to:", data.ownerEmail);
    logger.info({
      message: "Sending owner booking notification",
      ownerEmail: data.ownerEmail,
      ownerName: data.ownerName,
      renterName: data.renterName,
      address: data.address,
      gameDate: data.gameDate,
      parkingTime: data.parkingTime
    });

    // Build email HTML
    const html = buildOwnerBookingEmail(data);
    console.log("📧 Owner HTML built, now sending email...");

    // Send email via Resend
    console.log("📧 Calling resend.emails.send for owner...");
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: data.ownerEmail,
      subject: 'New Booking - PARKLI',
      html: html,
    });
    console.log("📧 resend.emails.send for owner completed with result:", result);

    if (result.error) {
      throw new Error(result.error.message);
    }

    console.log("✅ Owner notification sent!");
    logger.info({
      message: "Owner booking notification sent successfully",
      ownerEmail: data.ownerEmail,
      messageId: result.data?.id
    });

  } catch (error: any) {
    console.log("❌ Owner email error:", error.message);
    logger.error({
      message: "Error sending owner booking notification",
      error: error.message,
      ownerEmail: data.ownerEmail,
      stack: error.stack
    });
    // Don't throw - let booking succeed even if email fails
  }
}