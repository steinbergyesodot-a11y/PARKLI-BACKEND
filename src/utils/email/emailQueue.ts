import { EventEmitter } from 'events';
import * as emailService from './emailService';
import { logger } from '../logger/logger';

const emailEmitter = new EventEmitter();

// Listen for booking created event
emailEmitter.on('bookingCreated', async (data: { renterId: string; bookingId: string }) => {
  try {
    await emailService.sendBookingConfirmationEmail(data.renterId, data.bookingId);
  } catch (error) {
    logger.error({
      message: 'Error handling bookingCreated event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Listen for booking cancelled event
emailEmitter.on('bookingCancelled', async (data: { renterId: string; bookingId: string }) => {
  try {
    await emailService.sendBookingCancelledEmail(data.renterId, data.bookingId);
  } catch (error) {
    logger.error({
      message: 'Error handling bookingCancelled event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export function emitBookingCreated(renterId: string, bookingId: string) {
  emailEmitter.emit('bookingCreated', { renterId, bookingId });
}

export function emitBookingCancelled(renterId: string, bookingId: string) {
  emailEmitter.emit('bookingCancelled', { renterId, bookingId });
}
