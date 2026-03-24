import { BookingModel } from "../express/bookings/model";
import { logger } from "./logger/logger";

/**
 * Detects suspicious booking patterns
 * Returns { isSuspicious, reason, bookingCount, timeWindowMinutes }
 */
export async function detectRapidBookings(
  renterId: string,
  timeWindowMinutes: number = 10,
  maxBookingsAllowed: number = 10
): Promise<{
  isSuspicious: boolean;
  reason?: string;
  bookingCount?: number;
  timeWindowMinutes?: number;
}> {
  try {
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    // Find recent bookings by this renter
    const recentBookings = await BookingModel.find({
      renterId,
      bookedAt: { $gte: cutoffTime },
    });

    if (recentBookings.length >= maxBookingsAllowed) {
      logger.warn({
        message: "SECURITY: Rapid booking detected - possible fraud",
        renterId,
        bookingCount: recentBookings.length,
        timeWindowMinutes,
        maxAllowed: maxBookingsAllowed,
        bookingIds: recentBookings.map((b) => b._id),
      });

      return {
        isSuspicious: true,
        reason: `Too many bookings in ${timeWindowMinutes} minutes. Pattern suggests possible fraud.`,
        bookingCount: recentBookings.length,
        timeWindowMinutes,
      };
    }

    return {
      isSuspicious: false,
    };
  } catch (error: any) {
    logger.error({
      message: "Error in detectRapidBookings",
      error: error.message,
      renterId,
    });

    // On error, don't block the booking but log it
    return {
      isSuspicious: false,
    };
  }
}

/**
 * Detects suspicious patterns for the same driveway
 * Returns { isSuspicious, reason }
 */
export async function detectRepeatedBookingAttempts(
  renterId: string,
  drivewayId: string,
  timeWindowMinutes: number = 5
): Promise<{
  isSuspicious: boolean;
  reason?: string;
}> {
  try {
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeWindowMs);

    // Find recent booking attempts on the same driveway
    const attempts = await BookingModel.find({
      renterId,
      drivewayId,
      bookedAt: { $gte: cutoffTime },
    });

    if (attempts.length > 0) {
      logger.warn({
        message: "SECURITY: Repeated booking attempts detected",
        renterId,
        drivewayId,
        attemptCount: attempts.length,
        timeWindowMinutes,
      });

      return {
        isSuspicious: true,
        reason: `Multiple booking attempts on same driveway. Pattern suggests possible bot or abuse.`,
      };
    }

    return {
      isSuspicious: false,
    };
  } catch (error: any) {
    logger.error({
      message: "Error in detectRepeatedBookingAttempts",
      error: error.message,
      renterId,
      drivewayId,
    });

    return {
      isSuspicious: false,
    };
  }
}

/**
 * Logs payment failure with detailed context
 */
export function logPaymentFailure(details: {
  renterId: string;
  drivewayId: string;
  ownerId: string;
  amount: number;
  reason: string;
  errorMessage?: string;
  ip?: string;
}): void {
  logger.error({
    message: "SECURITY: Payment processing failed",
    renterId: details.renterId,
    drivewayId: details.drivewayId,
    ownerId: details.ownerId,
    amount: details.amount,
    reason: details.reason,
    errorMessage: details.errorMessage,
    ip: details.ip,
  });
}

/**
 * Logs successful payment with tracking
 */
export function logPaymentSuccess(details: {
  renterId: string;
  drivewayId: string;
  ownerId: string;
  amount: number;
  paymentIntentId: string;
  ip?: string;
}): void {
  logger.info({
    message: "Payment processed successfully",
    renterId: details.renterId,
    drivewayId: details.drivewayId,
    ownerId: details.ownerId,
    amount: details.amount,
    paymentIntentId: details.paymentIntentId,
    ip: details.ip,
  });
}
