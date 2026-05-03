"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const responseWrapper_1 = require("../responseWrapper");
function errorHandler(err, req, res, next) {
    // -------------------------
    // 400 — ZOD VALIDATION ERROR
    // -------------------------
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json((0, responseWrapper_1.responseWrapper)(false, null, "Validation failed"));
    }
    // -------------------------
    // 400 — BAD REQUEST ERRORS
    // -------------------------
    const badRequestErrors = [
        "Missing user ID",
        "Missing renter ID",
        "Missing booking ID",
        "Missing driveway ID",
        "Missing owner ID",
        "Missing parameters",
        "missing parameters",
        "You're missing parameters",
        "missing user first name",
        "missing access token",
        "Invalid renterId format",
        "Invalid bookingId format",
        "Invalid userId format",
        "Invalid ownerId format",
        "Invalid drivewayId format",
        "Invalid rules format",
        "Invalid ids",
        "Invalid first name",
        "Invalid last name",
        "Invalid input",
        "Invalid email format",
        "invalid date or time format",
        "Password must be at least 8 characters",
        "Roles must be an array",
        "Cancellation window has passed",
        "Email already in use",
        "Unable to create account",
        "At least one image is required",
        "You can upload a maximum of 5 images",
        "Invalid file type",
        "Invalid file extension",
        "File too large"
    ];
    if (badRequestErrors.includes(err.message)) {
        return res.status(400).json((0, responseWrapper_1.responseWrapper)(false, null, err.message));
    }
    // -------------------------
    // 401 — UNAUTHORIZED
    // -------------------------
    if (err.message === "Email or password invalid!") {
        return res.status(401).json((0, responseWrapper_1.responseWrapper)(false, null, "Email or password you entered aren't correct"));
    }
    // -------------------------
    // 404 — NOT FOUND
    // -------------------------
    const notFoundErrors = [
        "User not found",
        "Host not found",
        "Driveway not found",
        "Booking not found",
        "No bookings found for this renter",
        "No driveways found",
        "Stripe account not found for this user"
    ];
    if (notFoundErrors.includes(err.message)) {
        return res.status(404).json((0, responseWrapper_1.responseWrapper)(false, null, err.message));
    }
    // -------------------------
    // 400 — STRIPE ERRORS
    // -------------------------
    const stripeErrors = [
        "Host has not started Stripe onboarding yet",
        "Host has not completed Stripe onboarding"
    ];
    if (stripeErrors.includes(err.message)) {
        return res.status(400).json((0, responseWrapper_1.responseWrapper)(false, null, err.message));
    }
    // -------------------------
    // 500 — INTERNAL SERVER ERROR
    // -------------------------
    const serverErrors = [
        "Error fetching games",
        "Error fetching driveways",
        "Database query failed"
    ];
    if (serverErrors.includes(err.message)) {
        return res.status(500).json((0, responseWrapper_1.responseWrapper)(false, null, err.message));
    }
    return res.status(500).json((0, responseWrapper_1.responseWrapper)(false, null, "Internal server error"));
}
exports.default = errorHandler;
