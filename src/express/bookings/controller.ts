import mongoose from "mongoose";
import { Request, Response } from "express";
import { BookingManager } from "./manager";
import { BookingModel } from "./model";
import { userModel } from "../users/model";
import { drivewayModel } from "../driveways/model";
import stripe1 from "stripe";
import { stripe } from "../stripe";




export async function addBooking(req:Request, res:Response){
    
    const {ownerId,drivewayId,renterId,address,price,gameDate,parkingTime,visiting_team} = req.body
    
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate ||!parkingTime || !visiting_team){
            return res.status(400).json({message : 'You`re missing parameters'})
        }
        const ids = [ownerId, drivewayId, renterId];
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
             return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
        }

       
        try{
            const newBooking = await BookingManager.createBooking(req.body)
                return res.status(201).json({
                    message : "Created new booking",
                    booking : newBooking
                })
                }catch(error){
                    console.error("error",error)
                    return res.status(500).json({
                        error : "internal server error"
                    })
                }
}

export async function createPaymentIntent(req:Request, res:Response){


     const {ownerId,drivewayId,renterId,address,price,gameDate,parkingTime,visiting_team} = req.body
    
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate ||!parkingTime || !visiting_team){
            return res.status(400).json({message : 'You`re missing parameters'})
        }
        const ids = [ownerId, drivewayId, renterId];
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
             return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
        }

        // 3. Fetch the host (ownerId)
        const host = await userModel.findById(ownerId);
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
            parkingTime,
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

