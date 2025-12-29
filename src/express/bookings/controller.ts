import mongoose from "mongoose";
import { Request, Response } from "express";
import { BookingManager } from "./manager";
import { BookingModel } from "./model";




export async function addBooking(req:Request, res:Response){
    
    const {ownerId,drivewayId,renterId,address,price,gameDate,visiting_team} = req.body
    
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate || !visiting_team){
            return res.status(400).json({message : 'You`re missing parameters'})
        }
        const ids = [ownerId, drivewayId, renterId];
        const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));

        if (invalidIds.length > 0) {
             return res.status(400).json({ message: "Invalid ID(s)", invalidIds });
        }

       
        try{
            const newBooking = await BookingManager.createBooking(req.body)
            // const populatedBooking = await BookingModel.findById(newBooking._id)
            // .populate("ownerId") .populate("renterId") .populate("drivewayId");
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


export async function getBookingById(req:Request, res:Response){

}

export async function getAllBookings(req:Request, res:Response){

}

export async function updateBookingById(req:Request, res:Response){
      
       

      
}

export async function deleteBookingById(req:Request, res:Response){

}   