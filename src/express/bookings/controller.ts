import mongoose from "mongoose";
import { Request, Response } from "express";
import { BookingManager } from "./manager";
import { BookingModel } from "./model";




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




export async function getBookingByRenterId(req:Request, res:Response){
    
    const renterId = req.params.renterId
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
            res.status(200).json({
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

}   