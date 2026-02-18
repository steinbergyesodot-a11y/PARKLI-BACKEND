"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhookController = void 0;
const stripe_1 = __importDefault(require("stripe"));
const model_js_1 = require("../bookings/model.js");
const model_js_2 = require("../driveways/model.js");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const stripeWebhookController = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
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
            console.log("Booking created + driveway updated");
        }
        catch (err) {
            console.error("Error creating booking:", err);
            return res.status(500).send("Server error");
        }
    }
    res.status(200).send("Received");
};
exports.stripeWebhookController = stripeWebhookController;
