import { Request, Response, NextFunction } from "express";

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {

    // -------------------------
    // 400 — BAD REQUEST
    // -------------------------
    const badRequestErrors = [
        "Missing user ID",
        "Missing renter ID",
        "Missing booking ID",
        "Missing driveway ID",
        "Missing owner ID",
        "Missing parameters",
        "missing parameters",              // ⭐ added
        "You're missing parameters",
        "missing user first name",
        "missing access token",
        "Invalid renterId format",
        "Invalid bookingId format",
        "Invalid userId format",
        "Invalid ownerId format",
        "Invalid drivewayId format",
        "Invalid rules format",
        "invalid ids",
        "invalid date or time format",
        "Cancellation window has passed" ,
        "Email already in use"  // ⭐ added
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

export default errorHandler;
