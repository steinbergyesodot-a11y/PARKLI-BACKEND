"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBooking = addBooking;
exports.createPaymentIntent = createPaymentIntent;
exports.getBookingByRenterId = getBookingByRenterId;
exports.deleteBookingById = deleteBookingById;
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
        logger_1.logger.info({
            message: "Booking created successfully",
            bookingId: booking._id,
            drivewayId,
            renterId,
            ownerId
        });
        return res.status(201).json({
            message: "Created new booking",
            booking
        });
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
    var _a, _b, _c, _d;
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
            logger_1.logger.warn({
                message: "Payment intent failed: host not found",
                ownerId
            });
            return next(new Error("Host not found"));
        }
        if (!host.stripeAccountId) {
            logger_1.logger.warn({
                message: "Payment intent failed: host missing Stripe account",
                ownerId
            });
            return next(new Error("Host has not started Stripe onboarding yet"));
        }
        if (!host.isStripeVerified) {
            logger_1.logger.warn({
                message: "Payment intent failed: host not Stripe verified",
                ownerId
            });
            return next(new Error("Host has not completed Stripe onboarding"));
        }
        const driveway = await model_3.drivewayModel.findById(drivewayId);
        if (!driveway) {
            logger_1.logger.warn({
                message: "Payment intent failed: driveway not found",
                drivewayId
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
        logger_1.logger.info({
            message: "Stripe payment intent created",
            paymentIntentId: paymentIntent.id,
            amount: stripeAmount,
            renterId,
            drivewayId
        });
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: stripeAmount
        });
    }
    catch (err) {
        logger_1.logger.error({
            message: "Error in createPaymentIntent",
            error: err.message,
            stack: err.stack,
            ip: req.ip,
            renterId: (_c = req.body) === null || _c === void 0 ? void 0 : _c.renterId,
            drivewayId: (_d = req.body) === null || _d === void 0 ? void 0 : _d.drivewayId
        });
        next(err);
    }
}
async function getBookingByRenterId(req, res, next) {
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
        return res.status(200).json({
            message: "Found bookings",
            bookings
        });
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
async function deleteBookingById(req, res, next) {
    const bookingId = req.params.bookingId;
    // 1. Validate bookingId
    if (!bookingId) {
        return next(new Error("Missing booking ID"));
    }
    // 2. Validate ObjectId format
    if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
        return next(new Error("Invalid bookingId format"));
    }
    try {
        // 3. Attempt deletion
        const deletedBooking = await manager_1.BookingManager.deleteBookingById(bookingId);
        if (!deletedBooking) {
            return next(new Error("Booking not found"));
        }
        // 4. Success
        return res.status(200).json({
            message: "Booking deleted successfully"
        });
    }
    catch (error) {
        next(error); // Pass DB/server errors to middleware
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
        return res.status(200).json(Boolean(exists));
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
