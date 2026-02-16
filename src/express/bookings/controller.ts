import mongoose from "mongoose";
import { Request, Response } from "express";
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


export async function addBooking(req: Request, res: Response) {
    
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
        return res.status(400).json({ message: "You're missing parameters" });
    }

    // 2. Validate ObjectIds
    const ids = [ownerId, drivewayId, renterId];
    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
        return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
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
            return res.status(400).json({
                message: "Invalid date or time format. Expected YYYY-MM-DD and HH:mm."
            });
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
        console.error("Booking creation error:", error);
        return res.status(500).json({
            error: "internal server error"
        });
    }
}


export async function createPaymentIntent(req:Request, res:Response){

     const {ownerId,drivewayId,renterId,address,price,gameDate,parkingBegins,visiting_team} = req.body
    
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate ||!parkingBegins || !visiting_team){
            return res.status(400).json({message : 'You`re missing parameters'})
        }

        const ids = [ownerId, drivewayId, renterId];
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
             return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
        }

        // 3. Fetch the host (ownerId)
        const host = await userModel.findById(ownerId);
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
        const driveway = await drivewayModel.findById(drivewayId);

        if (!driveway) {
        return res.status(404).json({ message: "Driveway not found" });
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
        console.error("Stripe error:", error);
        return res.status(500).json({ message: "Stripe payment error" });
        }

}



export async function getBookingByRenterId(req:Request, res:Response){
    
    const renterId = req.params.renterId as string
        if(!renterId){
            return res.status(400).json({Message : "missing user Id."})
        }
        if(!mongoose.Types.ObjectId.isValid(renterId)) {
            res.status(400).json({ error: "Invalid playerId format" });
            return
        }
    try{
        const booking = await BookingManager.getBookingsByRenterId(renterId)
        if(booking.length > 0){
            return res.status(200).json({
                message: "found bookings",
                "bookings" : booking
            })
        }
        else{
            res.status(200).json({
                message: "could'nt find bookings for this user"
            })
        }
    }catch(error){
        res.status(500).json({
            "error" : error
        })
    }
    

}

export async function getAllBookings(req:Request, res:Response){

}

export async function updateBookingById(req:Request, res:Response){
      
       

      
}

export async function deleteBookingById(req:Request, res:Response){
        const bookingId = req.params.bookingId as string
        if(!bookingId){
            return res.status(400).json({Message : "missing booking Id."})
        }
       
        if(!mongoose.Types.ObjectId.isValid(bookingId)) {
            res.status(400).json({ error: "Invalid playerId format" });
            return
        }
        try{
            const deletedBooking = await BookingManager.deleteBookingById(bookingId)
            if(!deletedBooking){
                return res.status(404).json({ message: "Booking not found" });
            }
            return res.json({ message: "Booking deleted successfully" });
        }catch(error){
            console.error("Error deleting booking:", error); 
            return res.status(500).json({ message: "Server error" });
        }

}   



export async function checkIfUserHasBooking(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.json(false); // invalid ID → definitely no booking
    }

    const exists = await BookingModel.exists({ renterId: userId });
    return res.json(Boolean(exists));

  } catch (error) {
    console.error("Error checking booking:", error);
    return res.status(500).send("Internal server error");
  }
}

