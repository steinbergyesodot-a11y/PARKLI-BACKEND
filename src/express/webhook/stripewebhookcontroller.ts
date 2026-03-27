import { Request, Response } from "express";
import Stripe from "stripe";
import { BookingModel } from "../bookings/model.js";
import { drivewayModel } from "../driveways/model.js";
import { userModel } from "../users/model.js";
import { logger } from "../../utils/logger/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export const stripeWebhookController = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    logger.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const {
      renterId,
      ownerId,
      drivewayId,
      address,
      gameDate,
      parkingTime,
      visiting_team,
    } = paymentIntent.metadata;

    try {
      await BookingModel.create({
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

      await drivewayModel.findByIdAndUpdate(drivewayId, {
        $addToSet: { bookedDates: gameDate },
      });

    } catch (err) {
      logger.error("Error creating booking:", err);
      return res.status(500).send("Server error");
    }
  }

  // Handle Stripe account verification completion
  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    try {
      // Check if account has completed all requirements
      const isFullyVerified = 
        account.details_submitted &&
        account.charges_enabled &&
        account.payouts_enabled;

      logger.info({
        message: "Stripe account updated",
        stripeAccountId: account.id,
        isFullyVerified,
      });

      if (isFullyVerified) {
        // Find user by stripeAccountId
        const user = await userModel.findOneAndUpdate(
          { stripeAccountId: account.id },
          { isStripeVerified: true },
          { new: true }
        );

        if (user) {
          logger.info({
            message: "User Stripe verification completed",
            userId: user._id,
            stripeAccountId: account.id,
          });

          // Update all driveways for this user to be verified
          await drivewayModel.updateMany(
            { ownerId: user._id },
            { isStripeVerified: true }
          );

          logger.info({
            message: "Driveways marked as verified",
            userId: user._id,
          });
        }
      }
    } catch (err) {
      logger.error({
        message: "Error processing account.updated webhook",
        error: err,
      });
      return res.status(500).send("Server error");
    }
  }

  res.status(200).send("Received");
};
