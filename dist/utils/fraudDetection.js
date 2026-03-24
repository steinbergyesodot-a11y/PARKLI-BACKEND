"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRapidBookings = detectRapidBookings;
exports.detectRepeatedBookingAttempts = detectRepeatedBookingAttempts;
exports.logPaymentFailure = logPaymentFailure;
exports.logPaymentSuccess = logPaymentSuccess;
const model_1 = require("../express/bookings/model");
const logger_1 = require("./logger/logger");
/**
 * Detects suspicious booking patterns
 * Returns { isSuspicious, reason, bookingCount, timeWindowMinutes }
 */
async function detectRapidBookings(renterId, timeWindowMinutes = 10, maxBookingsAllowed = 10) {
    try {
        const timeWindowMs = timeWindowMinutes * 60 * 1000;
        const cutoffTime = new Date(Date.now() - timeWindowMs);
        // Find recent bookings by this renter
        const recentBookings = await model_1.BookingModel.find({
            renterId,
            bookedAt: { $gte: cutoffTime },
        });
        if (recentBookings.length >= maxBookingsAllowed) {
            logger_1.logger.warn({
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
    }
    catch (error) {
        logger_1.logger.error({
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
async function detectRepeatedBookingAttempts(renterId, drivewayId, timeWindowMinutes = 5) {
    try {
        const timeWindowMs = timeWindowMinutes * 60 * 1000;
        const cutoffTime = new Date(Date.now() - timeWindowMs);
        // Find recent booking attempts on the same driveway
        const attempts = await model_1.BookingModel.find({
            renterId,
            drivewayId,
            bookedAt: { $gte: cutoffTime },
        });
        if (attempts.length > 0) {
            logger_1.logger.warn({
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
    }
    catch (error) {
        logger_1.logger.error({
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
function logPaymentFailure(details) {
    logger_1.logger.error({
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
function logPaymentSuccess(details) {
    logger_1.logger.info({
        message: "Payment processed successfully",
        renterId: details.renterId,
        drivewayId: details.drivewayId,
        ownerId: details.ownerId,
        amount: details.amount,
        paymentIntentId: details.paymentIntentId,
        ip: details.ip,
    });
}
