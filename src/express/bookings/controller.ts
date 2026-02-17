import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";
import { BookingManager } from "./manager";
import { BookingModel } from "./model";
import { userModel } from "../users/model";
import { drivewayModel } from "../driveways/model";
import stripe1 from "stripe";
import { stripe } from "../stripe";
import { compareSync } from "bcrypt";


function convertTo24Hour(timeStr: string): string {
    const date = new Date(`1970-01-01 ${timeStr}`);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit"
    });
}


export async function addBooking(req: Request, res: Response, next:NextFunction) {
    
    const {
        ownerId,
        drivewayId,
        renterId,
        address,
        price,
        gameDate,
        parkingBegins,
        visiting_team
    } = req.body;
    console.log(req.body)
    // 1. Validate required fields
    if (!ownerId || !drivewayId || !renterId || !address || !price || !gameDate || !parkingBegins || !visiting_team) {
        return next(new Error("You're missing parameters"))
    }

    // 2. Validate ObjectIds
    const ids = [ownerId, drivewayId, renterId];
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return next(new Error(`invalid ids ${invalidIds}`))
    }

    try {
        // 3. Normalize time: "7:00" → "07:00"
        let normalizedTime = parkingBegins;
        if (parkingBegins.length === 4) {
            normalizedTime = "0" + parkingBegins;
        }

        // 4. Build booking start datetime
        const bookingStart = new Date(`${gameDate}T${normalizedTime}`);

        // 5. Validate date/time format
        if (isNaN(bookingStart.getTime())) {
            return next(new Error("Invalid date or time format. Expected YYY-MM-DD and HH:mm."))
        }

        // 6. Calculate cancelBy (24 hours before)
        const cancelBy = new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000);
        const cancelByString = cancelBy.toISOString();

        // 7. Build booking object
        const bookingData = {
            ownerId,
            drivewayId,
            renterId,
            address,
            price,
            gameDate,
            parkingTime: normalizedTime,
            visiting_team,
            cancelBy: cancelByString,
            bookedAt: new Date()
        };

        // 8. Save booking
        const newBooking = await BookingManager.createBooking(bookingData);

        return res.status(201).json({
            message: "Created new booking",
            booking: newBooking
        });

    } catch (error) {
     next(error)
    }
}


export async function createPaymentIntent(req:Request, res:Response,next:NextFunction){

     const {ownerId,drivewayId,renterId,address,price,gameDate,parkingBegins,visiting_team} = req.body
    
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate ||!parkingBegins || !visiting_team){
            return next(new Error("You're missing parameters"))
        }

        const ids = [ownerId, drivewayId, renterId];
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
            return next(new Error(`invalid ids ${invalidIds}`))

        }

        // 3. Fetch the host (ownerId)
        const host = await userModel.findById(ownerId);
        if (!host) {
            return next(new Error("Host not found"))
        }

        // 4. Check if host has a Stripe account
        if (!host.stripeAccountId) {
           return next(new Error("Host has not started Stripe onboarding yet"))
        }

        // 5. Check if host completed onboarding
        if (!host.isStripeVerified) {
            return next(new Error("Host has not completed Stripe onboarding"))
        }
       // 6. Fetch driveway
        const driveway = await drivewayModel.findById(drivewayId);

        if (!driveway) {
            return next(new Error("driveway not found"))
        }

        // 7. Calculate Stripe amount (in cents)
        const pricePerGame = driveway.price;   // e.g. 20
        const stripeAmount = pricePerGame * 100; // e.g. 2000
    // 8. Create PaymentIntent
        try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: stripeAmount,          // total price in cents
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
            parkingBegins,
            visiting_team
            }
        });

        // 9. Return client_secret to frontend
        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: stripeAmount
        });

        } catch (error) {
        next(error)
        }
}

export async function getBookingByRenterId(req: Request, res: Response, next: NextFunction) {
    const renterId = req.params.renterId as string;
    if (!renterId) {
        return next(new Error("Missing renter ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(renterId)) {
        return next(new Error("Invalid renterId format"));
    }

    try {
        const bookings = await BookingManager.getBookingsByRenterId(renterId);
        if (!bookings || bookings.length === 0) {
            return next(new Error("No bookings found for this renter"));
        }
        return res.status(200).json({
            message: "Found bookings",
            bookings
        });

    } catch (error) {
        next(error); 
    }
}


export async function getAllBookings(req:Request, res:Response){

}

export async function updateBookingById(req:Request, res:Response){
      
       

      
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
