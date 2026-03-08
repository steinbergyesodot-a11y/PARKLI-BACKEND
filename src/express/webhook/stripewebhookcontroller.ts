import { Request, Response } from "express";
import Stripe from "stripe";
import { BookingModel } from "../bookings/model.js";
import { drivewayModel } from "../driveways/model.js";

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
    console.error("Webhook signature verification failed:", err.message);
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
      console.error("Error creating booking:", err);
      return res.status(500).send("Server error");
    }
  }

  res.status(200).send("Received");
};
