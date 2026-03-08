import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { BookingManager } from "./manager";
import { BookingModel } from "./model";
import { userModel } from "../users/model";
import { drivewayModel } from "../driveways/model";
import stripe1 from "stripe";
import { stripe } from "../stripe";
import { compareSync } from "bcrypt";
import { DrivewayManager } from "../driveways/manager";
import { bookingSchemaZod, paymentIntentSchemaZod } from "./validation";
import { logger } from "../../utils/logger/logger";


function convertTo24Hour(timeStr: string): string {
    const date = new Date(`1970-01-01 ${timeStr}`);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });
}

function buildChicagoDate(dateStr: string, timeStr: string) {
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
    .find(p => p.type === "timeZoneName")!.value;

  // Convert CST/CDT → offset hours
  const offsetHours = offset === "CST" ? -6 : -5;

  // 5. Apply offset
  chicago.setHours(chicago.getHours() - offsetHours);

  return chicago;
}



export async function addBooking(req: Request, res: Response, next: NextFunction) {
  logger.info({
    message: "addBooking called",
    ip: req.ip,
  });

  try {
    const data = bookingSchemaZod.parse(req.body);

    const {
      ownerId,
      drivewayId,
      renterId,
      address,
      price,
      gameDate,
      paymentIntentId,
      parkingBegins,
      visiting_team
    } = data;

    logger.info({
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
      logger.warn({
        message: "Invalid booking date/time",
        gameDate,
        normalizedTime
      });
      return next(new Error("Invalid date or time format. Expected YYYY-MM-DD and HH:mm."));
    }

    const cancelBy = new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000);
    const cancelByString = cancelBy.toISOString();

    const booking = await BookingModel.create({
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
      logger.warn({
        message: "Booking failed: driveway already booked",
        drivewayId,
        renterId
      });
      return next(new Error("Sorry, this driveway was just booked by someone else."));
    }

    logger.info({
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

  } catch (err: any) {
    logger.error({
      message: "Error in addBooking",
      error: err.message,
      stack: err.stack,
      ip: req.ip
    });
    next(err);
  }
}


export async function createPaymentIntent(req: Request, res: Response, next: NextFunction) {

  logger.info({
    message: "createPaymentIntent called",
    ip: req.ip,
    renterId: req.body?.renterId,
    drivewayId: req.body?.drivewayId
  });

  try {
    const data = paymentIntentSchemaZod.parse(req.body);

    const {
      ownerId,
      drivewayId,
      renterId,
      address,
      price,
      gameDate,
      parkingBegins,
      visiting_team
    } = data;

    logger.info({
      message: "Parsed payment intent data",
      ownerId,
      renterId,
      drivewayId,
      price
    });

    const host = await userModel.findById(ownerId);
    if (!host) {
      logger.warn({
        message: "Payment intent failed: host not found",
        ownerId
      });
      return next(new Error("Host not found"));
    }

    if (!host.stripeAccountId) {
      logger.warn({
        message: "Payment intent failed: host missing Stripe account",
        ownerId
      });
      return next(new Error("Host has not started Stripe onboarding yet"));
    }

    if (!host.isStripeVerified) {
      logger.warn({
        message: "Payment intent failed: host not Stripe verified",
        ownerId
      });
      return next(new Error("Host has not completed Stripe onboarding"));
    }

    const driveway = await drivewayModel.findById(drivewayId);
    if (!driveway) {
      logger.warn({
        message: "Payment intent failed: driveway not found",
        drivewayId
      });
      return next(new Error("driveway not found"));
    }

    const pricePerGame = driveway.price;
    const stripeAmount = pricePerGame * 100;

    logger.info({
      message: "Creating Stripe payment intent",
      stripeAmount,
      ownerId,
      renterId,
      drivewayId
    });

    const paymentIntent = await stripe.paymentIntents.create({
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

    logger.info({
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

  } catch (err: any) {
    logger.error({
      message: "Error in createPaymentIntent",
      error: err.message,
      stack: err.stack,
      ip: req.ip,
      renterId: req.body?.renterId,
      drivewayId: req.body?.drivewayId
    });
    next(err);
  }
}

export async function getBookingByRenterId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;

    logger.info({
        message: "getBookingByRenterId called",
        renterId: userId,
        ip: req.ip
    });

    if (!userId) {
        logger.warn({
            message: "Missing renter ID",
            ip: req.ip
        });
        return next(new Error("Missing renter ID"));
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn({
            message: "Invalid renterId format",
            renterId: userId,
            ip: req.ip
        });
        return next(new Error("Invalid renterId format"));
    }

    try {
        const bookings = await BookingManager.getBookingsByRenterId(userId);

        if (!bookings || bookings.length === 0) {
            logger.warn({
                message: "No bookings found for renter",
                renterId: userId,
                ip: req.ip
            });
            return next(new Error("No bookings found for this renter"));
        }

        logger.info({
            message: "Bookings fetched successfully",
            renterId: userId,
            count: bookings.length
        });

        return res.status(200).json({
            message: "Found bookings",
            bookings
        });

    } catch (error: any) {
        logger.error({
            message: "Error in getBookingByRenterId",
            error: error.message,
            stack: error.stack,
            renterId: userId,
            ip: req.ip
        });
        next(error);
    }
}


export async function deleteBookingById(req: Request, res: Response, next: NextFunction) {
    const bookingId = req.params.bookingId as string;

    // 1. Validate bookingId
    if (!bookingId) {
        return next(new Error("Missing booking ID"));
    }

    // 2. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return next(new Error("Invalid bookingId format"));
    }

    try {
        // 3. Attempt deletion
        const deletedBooking = await BookingManager.deleteBookingById(bookingId);

        if (!deletedBooking) {
            return next(new Error("Booking not found"));
        }

        // 4. Success
        return res.status(200).json({
            message: "Booking deleted successfully"
        });

    } catch (error) {
        next(error); // Pass DB/server errors to middleware
    }
}



export async function checkIfUserHasBooking(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid userId format"));
    }
    try {
        const exists = await BookingModel.exists({ renterId: userId });
        return res.status(200).json(Boolean(exists));
    } catch (error) {
        next(error); 
    }
}


export async function cancelBooking(req:Request,res:Response,next: NextFunction){
    const {drivewayId,gameDate,bookingId} = req.body
    if(!drivewayId || !gameDate || !bookingId){
        return next(new Error("missing parameters"))
    }
    try{
        const booking = await BookingModel.findById(bookingId)
        if (!booking) { 
            return next(new Error("Booking not found"));
        }
        const now = new Date();
        const cancelDeadline = new Date(booking.cancelBy);
        if (now > cancelDeadline) { 
            return next(new Error("Cancellation window has passed"));
        }
        const refund = await stripe.refunds.create({ 
            payment_intent: booking.paymentIntentId 
        });

        await BookingModel.findByIdAndDelete(bookingId); // delete booking from booking model

        const updatedDriveway = await DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate); // update availablity

        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }
    }catch(error){
        next(error)
    }
} 