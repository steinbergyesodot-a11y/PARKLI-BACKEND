import nodemailer from 'nodemailer';
import { logger } from '../logger/logger';
import { userModel } from '../../express/users/model';
import { BookingModel } from '../../express/bookings/model';

// Import email templates
const bookingConfirmation = (data: any): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; border-radius: 5px; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; }
          .price { font-size: 24px; color: #007bff; font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed! 🎉</h1>
          </div>

          <p>Hi ${data.renterName},</p>
          <p>Your parking space has been successfully booked for the game.</p>

          <div class="content">
            <h2>Booking Details</h2>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${data.bookingId}</span>
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
              <span class="detail-label">Team:</span>
              <span>${data.visitingTeam}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Price:</span>
              <span class="price">$\${(data.price / 100).toFixed(2)}</span>
            </div>
          </div>

          <p><strong>Cancellation Policy:</strong> You can cancel up to 24 hours before the parking time.</p>

          <div class="footer">
            <p>Thank you for using PARKLI!</p>
            <p>&copy; 2026 PARKLI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const bookingCancelled = (data: any): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px; }
          .content { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
          .detail-label { font-weight: bold; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>

          <p>Hi ${data.renterName},</p>
          <p>Your booking has been cancelled.</p>

          <div class="content">
            <h2>Cancellation Details</h2>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span>${data.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span>${data.address}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Game Date:</span>
              <span>${data.gameDate}</span>
            </div>
          </div>

          <p>If you have any questions, please contact our support team.</p>

          <div class="footer">
            <p>Thank you for using PARKLI!</p>
            <p>&copy; 2026 PARKLI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendBookingConfirmationEmail(renterId: string, bookingId: string) {
  try {
    // Fetch renter details
    const renter = await userModel.findById(renterId);
    if (!renter || !renter.email) {
      logger.warn({
        message: 'Cannot send email: renter not found or has no email',
        renterId,
      });
      return;
    }

    // Fetch booking details
    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      logger.warn({
        message: 'Cannot send email: booking not found',
        bookingId,
      });
      return;
    }

    // Generate email HTML
    const html = bookingConfirmation({
      renterName: renter.firstName,
      bookingId: booking._id?.toString() || '',
      address: booking.address,
      gameDate: booking.gameDate,
      parkingTime: booking.parkingTime,
      price: booking.price,
      visitingTeam: booking.visiting_team,
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: renter.email,
      subject: 'Booking Confirmed - PARKLI',
      html,
    });

    logger.info({
      message: 'Booking confirmation email sent',
      renterId,
      bookingId,
      email: renter.email,
    });
  } catch (error: any) {
    logger.error({
      message: 'Failed to send booking confirmation email',
      error: error.message,
      renterId,
      bookingId,
    });
  }
}

export async function sendBookingCancelledEmail(renterId: string, bookingId: string) {
  try {
    const renter = await userModel.findById(renterId);
    if (!renter || !renter.email) {
      logger.warn({
        message: 'Cannot send cancellation email: renter not found',
        renterId,
      });
      return;
    }

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      logger.warn({
        message: 'Cannot send cancellation email: booking not found',
        bookingId,
      });
      return;
    }

    const html = bookingCancelled({
      renterName: renter.firstName,
      bookingId: booking._id?.toString() || '',
      address: booking.address,
      gameDate: booking.gameDate,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: renter.email,
      subject: 'Booking Cancelled - PARKLI',
      html,
    });

    logger.info({
      message: 'Booking cancellation email sent',
      renterId,
      bookingId,
    });
  } catch (error: any) {
    logger.error({
      message: 'Failed to send booking cancellation email',
      error: error.message,
      renterId,
      bookingId,
    });
  }
}
