"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBooking = addBooking;
exports.createPaymentIntent = createPaymentIntent;
exports.getBookingsByRenterId = getBookingsByRenterId;
exports.checkIfUserHasBooking = checkIfUserHasBooking;
exports.cancelBooking = cancelBooking;
const mongoose_1 = __importDefault(require("mongoose"));
const manager_1 = require("./manager");
const model_1 = require("./model");
const model_2 = require("../users/model");
const model_3 = require("../driveways/model");
const stripe_1 = require("../stripe");
const manager_2 = require("../driveways/manager");
const validation_1 = require("./validation");
const logger_1 = require("../../utils/logger/logger");
const fraudDetection_1 = require("../../utils/fraudDetection");
const responseWrapper_1 = require("../../utils/responseWrapper");
const email_1 = require("../../utils/email");
function convertTo24Hour(timeStr) {
    const date = new Date(`1970-01-01 ${timeStr}`);
    if (isNaN(date.getTime()))
        return "";
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });
}
function buildChicagoDate(dateStr, timeStr) {
    // 1. Split date
    const [year, month, day] = dateStr.split("-").map(Number);
    // 2. Split time
    const [hour, minute] = timeStr.split(":").map(Number);
    // 3. Create a Date *as if* it's Chicago time
    const chicago = new Date(Date.UTC(year, month - 1, day, hour, minute));
    // 4. Get Chicago offset for that date (DST-aware)
    const offset = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Chicago",
        timeZoneName: "short"
    })
        .formatToParts(chicago)
        .find(p => p.type === "timeZoneName").value;
    // Convert CST/CDT → offset hours
    const offsetHours = offset === "CST" ? -6 : -5;
    // 5. Apply offset
    chicago.setHours(chicago.getHours() - offsetHours);
    return chicago;
}
async function addBooking(req, res, next) {
    logger_1.logger.info({
        message: "addBooking called",
        ip: req.ip,
    });
    console.log("adding booking");
    try {
        const data = validation_1.bookingSchemaZod.parse(req.body);
        const { ownerId, drivewayId, renterId, address, price, gameDate, paymentIntentId, parkingBegins, visiting_team } = data;
        logger_1.logger.info({
            message: "Parsed booking data",
            drivewayId,
            renterId,
            ownerId,
            gameDate,
            parkingBegins
        });
        // SECURITY: Check for rapid bookings (fraud detection)
        const rapidBookingCheck = await (0, fraudDetection_1.detectRapidBookings)(renterId, 10, 10);
        if (rapidBookingCheck.isSuspicious) {
            logger_1.logger.warn({
                message: "Booking rejected: suspicious rapid booking pattern",
                renterId,
                drivewayId,
                reason: rapidBookingCheck.reason
            });
            return next(new Error("Too many bookings in a short period. Please try again later."));
        }
        // SECURITY: Check for repeated attempts on same driveway
        const repeatedAttemptCheck = await (0, fraudDetection_1.detectRepeatedBookingAttempts)(renterId, drivewayId, 5);
        if (repeatedAttemptCheck.isSuspicious) {
            logger_1.logger.warn({
                message: "Booking rejected: repeated attempts on same driveway",
                renterId,
                drivewayId,
                reason: repeatedAttemptCheck.reason
            });
            return next(new Error("Multiple attempts detected on this driveway. Please try another one."));
        }
        let normalizedTime = parkingBegins;
        if (parkingBegins.length === 4) {
            normalizedTime = "0" + parkingBegins;
        }
        const bookingStart = buildChicagoDate(gameDate, normalizedTime);
        if (isNaN(bookingStart.getTime())) {
            logger_1.logger.warn({
                message: "Invalid booking date/time",
                gameDate,
                normalizedTime
            });
            return next(new Error("Invalid date or time format. Expected YYYY-MM-DD and HH:mm."));
        }
        const cancelBy = new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000);
        const cancelByString = cancelBy.toISOString();
        const booking = await model_1.BookingModel.create({
            drivewayId,
            ownerId,
            renterId,
            address,
            price,
            gameDate,
            parkingTime: normalizedTime,
            paymentIntentId,
            cancelBy: cancelByString,
            visiting_team,
            isBooked: true
        });
        if (!booking) {
            logger_1.logger.warn({
                message: "Booking failed: driveway already booked",
                drivewayId,
                renterId
            });
            return next(new Error("Sorry, this driveway was just booked by someone else."));
        }
        const renter = await model_2.userModel.findById(renterId).select('firstName email');
        if (!renter) {
            logger_1.logger.warn({
                message: "Renter not found",
                renterId
            });
            return next(new Error("Renter not found"));
        }
        logger_1.logger.info({
            message: "Booking created successfully",
            bookingId: booking._id,
            drivewayId,
            renterId,
            ownerId
        });
        // Send booking notification to renter (fire-and-forget, email errors won't crash booking)
        try {
            (0, email_1.sendBookingNotification)({
                firstName: renter.firstName,
                email: renter.email,
                address: booking.address,
                gameDate: booking.gameDate,
                parkingTime: booking.parkingTime,
                bookedAt: booking.bookedAt,
                cancelBy: booking.cancelBy,
                visitingTeam: booking.visiting_team
            });
        }
        catch (emailError) {
            console.error("⚠️  Error calling sendBookingNotification:", emailError.message);
            logger_1.logger.error({
                message: "Error calling sendBookingNotification",
                error: emailError.message
            });
        }
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, booking, null));
    }
    catch (err) {
        logger_1.logger.error({
            message: "Error in addBooking",
            error: err.message,
            stack: err.stack,
            ip: req.ip
        });
        next(err);
    }
}
async function createPaymentIntent(req, res, next) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    logger_1.logger.info({
        message: "createPaymentIntent called",
        ip: req.ip,
        renterId: (_a = req.body) === null || _a === void 0 ? void 0 : _a.renterId,
        drivewayId: (_b = req.body) === null || _b === void 0 ? void 0 : _b.drivewayId
    });
    try {
        const data = validation_1.paymentIntentSchemaZod.parse(req.body);
        const { ownerId, drivewayId, renterId, address, price, gameDate, parkingBegins, visiting_team } = data;
        logger_1.logger.info({
            message: "Parsed payment intent data",
            ownerId,
            renterId,
            drivewayId,
            price
        });
        const host = await model_2.userModel.findById(ownerId);
        if (!host) {
            (0, fraudDetection_1.logPaymentFailure)({
                renterId,
                drivewayId,
                ownerId,
                amount: price,
                reason: "Host not found",
                ip: req.ip
            });
            return next(new Error("Host not found"));
        }
        if (!host.stripeAccountId) {
            (0, fraudDetection_1.logPaymentFailure)({
                renterId,
                drivewayId,
                ownerId,
                amount: price,
                reason: "Host missing Stripe account",
                ip: req.ip
            });
            return next(new Error("Host has not started Stripe onboarding yet"));
        }
        if (!host.isStripeVerified) {
            (0, fraudDetection_1.logPaymentFailure)({
                renterId,
                drivewayId,
                ownerId,
                amount: price,
                reason: "Host not Stripe verified",
                ip: req.ip
            });
            return next(new Error("Host has not completed Stripe onboarding"));
        }
        const driveway = await model_3.drivewayModel.findById(drivewayId);
        if (!driveway) {
            (0, fraudDetection_1.logPaymentFailure)({
                renterId,
                drivewayId,
                ownerId,
                amount: price,
                reason: "Driveway not found",
                ip: req.ip
            });
            return next(new Error("driveway not found"));
        }
        const pricePerGame = driveway.price;
        const stripeAmount = pricePerGame * 100;
        logger_1.logger.info({
            message: "Creating Stripe payment intent",
            stripeAmount,
            ownerId,
            renterId,
            drivewayId
        });
        const paymentIntent = await stripe_1.stripe.paymentIntents.create({
            amount: stripeAmount,
            currency: "usd",
            application_fee_amount: Math.round(stripeAmount * 0.12),
            transfer_data: {
                destination: host.stripeAccountId,
            },
            metadata: {
                ownerId,
                renterId,
                drivewayId,
                address,
                gameDate,
                parkingBegins,
                visiting_team
            }
        });
        (0, fraudDetection_1.logPaymentSuccess)({
            renterId,
            drivewayId,
            ownerId,
            amount: stripeAmount,
            paymentIntentId: paymentIntent.id,
            ip: req.ip
        });
        logger_1.logger.info({
            message: "Stripe payment intent created",
            paymentIntentId: paymentIntent.id,
            amount: stripeAmount,
            renterId,
            drivewayId
        });
        return res.status(200).json((0, responseWrapper_1.responseWrapper)(true, {
            clientSecret: paymentIntent.client_secret,
            amount: stripeAmount
        }, null));
    }
    catch (err) {
        (0, fraudDetection_1.logPaymentFailure)({
            renterId: (_c = req.body) === null || _c === void 0 ? void 0 : _c.renterId,
            drivewayId: (_d = req.body) === null || _d === void 0 ? void 0 : _d.drivewayId,
            ownerId: (_e = req.body) === null || _e === void 0 ? void 0 : _e.ownerId,
            amount: ((_f = req.body) === null || _f === void 0 ? void 0 : _f.price) || 0,
            reason: "Unexpected error in payment processing",
            errorMessage: err.message,
            ip: req.ip
        });
        logger_1.logger.error({
            message: "Error in createPaymentIntent",
            error: err.message,
            stack: err.stack,
            ip: req.ip,
            renterId: (_g = req.body) === null || _g === void 0 ? void 0 : _g.renterId,
            drivewayId: (_h = req.body) === null || _h === void 0 ? void 0 : _h.drivewayId
        });
        next(err);
    }
}
async function getBookingsByRenterId(req, res, next) {
    const userId = req.params.userId;
    logger_1.logger.info({
        message: "getBookingByRenterId called",
        renterId: userId,
        ip: req.ip
    });
    if (!userId) {
        logger_1.logger.warn({
            message: "Missing renter ID",
            ip: req.ip
        });
        return next(new Error("Missing renter ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        logger_1.logger.warn({
            message: "Invalid renterId format",
            renterId: userId,
            ip: req.ip
        });
        return next(new Error("Invalid renterId format"));
    }
    try {
        const bookings = await manager_1.BookingManager.getBookingsByRenterId(userId);
        if (!bookings || bookings.length === 0) {
            logger_1.logger.warn({
                message: "No bookings found for renter",
                renterId: userId,
                ip: req.ip
            });
            return next(new Error("No bookings found for this renter"));
        }
        logger_1.logger.info({
            message: "Bookings fetched successfully",
            renterId: userId,
            count: bookings.length
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, bookings, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getBookingByRenterId",
            error: error.message,
            stack: error.stack,
            renterId: userId,
            ip: req.ip
        });
        next(error);
    }
}
async function checkIfUserHasBooking(req, res, next) {
    const userId = req.params.userId;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid userId format"));
    }
    try {
        const exists = await model_1.BookingModel.exists({ renterId: userId });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, exists, null));
    }
    catch (error) {
        next(error);
    }
}
async function cancelBooking(req, res, next) {
    const { drivewayId, gameDate, bookingId } = req.body;
    if (!drivewayId || !gameDate || !bookingId) {
        return next(new Error("missing parameters"));
    }
    try {
        const booking = await model_1.BookingModel.findById(bookingId);
        if (!booking) {
            return next(new Error("Booking not found"));
        }
        const now = new Date();
        const cancelDeadline = new Date(booking.cancelBy);
        if (now > cancelDeadline) {
            return next(new Error("Cancellation window has passed"));
        }
        const refund = await stripe_1.stripe.refunds.create({
            payment_intent: booking.paymentIntentId
        });
        await model_1.BookingModel.findByIdAndDelete(bookingId); // delete booking from booking model
        const updatedDriveway = await manager_2.DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate); // update availablity
        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }
        return res.status(200).json({
            message: "Booking cancelled successfully",
            refund: refund
        });
    }
    catch (error) {
        next(error);
    }
}
