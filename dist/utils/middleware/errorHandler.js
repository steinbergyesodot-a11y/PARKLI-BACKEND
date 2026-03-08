"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: "validation_error",
            errors: err.issues
        });
    }
    // -------------------------
    // 400 — BAD REQUEST
    // -------------------------
    const badRequestErrors = [
        // Missing fields
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
        // Invalid formats
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
        // Password / roles
        "Password must be at least 8 characters",
        "Roles must be an array",
        // Business logic
        "Cancellation window has passed",
        "Email already in use",
        "Unable to create account",
        // FILE VALIDATION ERRORS
        "At least one image is required",
        "You can upload a maximum of 5 images",
        "Invalid file type",
        "Invalid file extension",
        "File too large"
    ];
    if (badRequestErrors.includes(err.message)) {
        return res.status(400).json({ error: err.message });
    }
    // -------------------------
    // 401 — UNAUTHORIZED
    // -------------------------
    if (err.message === "Email or password invalid!") {
        return res.status(401).json({
            error: "Email or password you entered aren't correct"
        });
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
        return res.status(404).json({ error: err.message });
    }
    // -------------------------
    // 400 — STRIPE ONBOARDING ERRORS
    // -------------------------
    const stripeErrors = [
        "Host has not started Stripe onboarding yet",
        "Host has not completed Stripe onboarding"
    ];
    if (stripeErrors.includes(err.message)) {
        return res.status(400).json({ error: err.message });
    }
    // -------------------------
    // 500 — INTERNAL SERVER ERROR
    // -------------------------
    return res.status(500).json({
        error: "Internal server error",
        details: err.message
    });
}
exports.default = errorHandler;
