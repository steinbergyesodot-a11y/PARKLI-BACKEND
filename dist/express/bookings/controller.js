"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBooking = addBooking;
exports.createPaymentIntent = createPaymentIntent;
exports.getBookingByRenterId = getBookingByRenterId;
exports.getAllBookings = getAllBookings;
exports.updateBookingById = updateBookingById;
exports.deleteBookingById = deleteBookingById;
exports.checkIfUserHasBooking = checkIfUserHasBooking;
const mongoose_1 = __importDefault(require("mongoose"));
const manager_1 = require("./manager");
const model_1 = require("./model");
const model_2 = require("../users/model");
const model_3 = require("../driveways/model");
const stripe_1 = require("../stripe");
async function addBooking(req, res) {
    const { ownerId, drivewayId, renterId, address, price, gameDate, parkingTime, visiting_team } = req.body;
    if (!ownerId || !drivewayId || !renterId || !address || !price || !gameDate || !parkingTime || !visiting_team) {
        return res.status(400).json({ message: 'You`re missing parameters' });
    }
    const ids = [ownerId, drivewayId, renterId];
    const invalidIds = ids.filter(id => !mongoose_1.default.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
    }
    try {
        const newBooking = await manager_1.BookingManager.createBooking(req.body);
        return res.status(201).json({
            message: "Created new booking",
            booking: newBooking
        });
    }
    catch (error) {
        console.error("error", error);
        return res.status(500).json({
            error: "internal server error"
        });
    }
}
async function createPaymentIntent(req, res) {
    const { ownerId, drivewayId, renterId, address, price, gameDate, parkingTime, visiting_team } = req.body;
    if (!ownerId || !drivewayId || !renterId || !address || !price || !gameDate || !parkingTime || !visiting_team) {
        return res.status(400).json({ message: 'You`re missing parameters' });
    }
    const ids = [ownerId, drivewayId, renterId];
    const invalidIds = ids.filter(id => !mongoose_1.default.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
    }
    // 3. Fetch the host (ownerId)
    const host = await model_2.userModel.findById(ownerId);
    console.log("HOST:", host);
    console.log("stripeAccountId:", host?.stripeAccountId);
    console.log("isStripeVerified:", host?.isStripeVerified);
    if (!host) {
        return res.status(404).json({ message: "Host not found" });
    }
    // 4. Check if host has a Stripe account
    if (!host.stripeAccountId) {
        return res.status(400).json({
            message: "Host has not started Stripe onboarding yet"
        });
    }
    // 5. Check if host completed onboarding
    if (!host.isStripeVerified) {
        return res.status(400).json({
            message: "Host has not completed Stripe onboarding"
        });
    }
    // 6. Fetch driveway
    const driveway = await model_3.drivewayModel.findById(drivewayId);
    if (!driveway) {
        return res.status(404).json({ message: "Driveway not found" });
    }
    // 7. Calculate Stripe amount (in cents)
    const pricePerGame = driveway.price; // e.g. 20
    const stripeAmount = pricePerGame * 100; // e.g. 2000
    // 8. Create PaymentIntent
    try {
        const paymentIntent = await stripe_1.stripe.paymentIntents.create({
            amount: stripeAmount, // total price in cents
            currency: "usd",
            application_fee_amount: Math.round(stripeAmount * 0.12), // 12% platform fee (example)
            transfer_data: {
                destination: host.stripeAccountId, // host receives payout
            },
            metadata: {
                ownerId,
                renterId,
                drivewayId,
                address,
                gameDate,
                parkingTime,
                visiting_team
            }
        });
        // 9. Return client_secret to frontend
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: stripeAmount
        });
    }
    catch (error) {
        console.error("Stripe error:", error);
        return res.status(500).json({ message: "Stripe payment error" });
    }
}
async function getBookingByRenterId(req, res) {
    const renterId = req.params.renterId;
    if (!renterId) {
        return res.status(400).json({ Message: "missing user Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(renterId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return;
    }
    try {
        const booking = await manager_1.BookingManager.getBookingsByRenterId(renterId);
        if (booking.length > 0) {
            return res.status(200).json({
                message: "found bookings",
                "bookings": booking
            });
        }
        else {
            res.status(200).json({
                message: "could'nt find bookings for this user"
            });
        }
    }
    catch (error) {
        res.status(500).json({
            "error": error
        });
    }
}
async function getAllBookings(req, res) {
}
async function updateBookingById(req, res) {
}
async function deleteBookingById(req, res) {
    const bookingId = req.params.bookingId;
    if (!bookingId) {
        return res.status(400).json({ Message: "missing booking Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return;
    }
    try {
        const deletedBooking = await manager_1.BookingManager.deleteBookingById(bookingId);
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        return res.json({ message: "Booking deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting booking:", error);
        return res.status(500).json({ message: "Server error" });
    }
}
async function checkIfUserHasBooking(req, res) {
    try {
        const userId = req.params.userId;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.json(false); // invalid ID → definitely no booking
        }
        const exists = await model_1.BookingModel.exists({ renterId: userId });
        return res.json(Boolean(exists));
    }
    catch (error) {
        console.error("Error checking booking:", error);
        return res.status(500).send("Internal server error");
    }
}
