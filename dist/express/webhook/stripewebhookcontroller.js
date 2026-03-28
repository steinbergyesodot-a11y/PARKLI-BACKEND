"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookController = void 0;
const stripe_1 = __importDefault(require("stripe"));
const model_js_1 = require("../bookings/model.js");
const model_js_2 = require("../driveways/model.js");
const model_js_3 = require("../users/model.js");
const logger_js_1 = require("../../utils/logger/logger.js");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const stripeWebhookController = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        logger_js_1.logger.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        const { renterId, ownerId, drivewayId, address, gameDate, parkingTime, visiting_team, } = paymentIntent.metadata;
        try {
            await model_js_1.BookingModel.create({
                renterId,
                ownerId,
                drivewayId,
                address,
                gameDate,
                parkingTime,
                visiting_team,
                amountPaid: paymentIntent.amount,
                paymentIntentId: paymentIntent.id,
                status: "paid",
            });
            await model_js_2.drivewayModel.findByIdAndUpdate(drivewayId, {
                $addToSet: { bookedDates: gameDate },
            });
        }
        catch (err) {
            logger_js_1.logger.error("Error creating booking:", err);
            return res.status(500).send("Server error");
        }
    }
    // Handle Stripe account verification completion
    if (event.type === "account.updated") {
        const account = event.data.object;
        try {
            // Check if account has completed all requirements
            const isFullyVerified = account.details_submitted &&
                account.charges_enabled &&
                account.payouts_enabled;
            logger_js_1.logger.info({
                message: "Stripe account updated",
                stripeAccountId: account.id,
                isFullyVerified,
            });
            if (isFullyVerified) {
                // Find user by stripeAccountId
                const user = await model_js_3.userModel.findOneAndUpdate({ stripeAccountId: account.id }, { isStripeVerified: true }, { new: true });
                if (user) {
                    logger_js_1.logger.info({
                        message: "User Stripe verification completed",
                        userId: user._id,
                        stripeAccountId: account.id,
                    });
                    // Update all driveways for this user to be verified
                    await model_js_2.drivewayModel.updateMany({ ownerId: user._id }, { isStripeVerified: true });
                    logger_js_1.logger.info({
                        message: "Driveways marked as verified",
                        userId: user._id,
                    });
                }
            }
        }
        catch (err) {
            logger_js_1.logger.error({
                message: "Error processing account.updated webhook",
                error: err,
            });
            return res.status(500).send("Server error");
        }
    }
    res.status(200).send("Received");
};
exports.stripeWebhookController = stripeWebhookController;
