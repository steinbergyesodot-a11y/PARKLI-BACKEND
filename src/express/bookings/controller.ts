import mongoose from "mongoose";
import { Request, Response } from "express";
import { BookingManager } from "./manager";




export async function addBooking(req:Request, res:Response){
    
    const {ownerId,drivewayId,renterId,address,price,gameDate,visiting_team} = req.body
        if(!ownerId || !drivewayId || !renterId || !address || !price || !gameDate || !visiting_team){
            return res.status(400).json({message : 'You`re missing parameters'})
        }

        if(!mongoose.Types.ObjectId.isValid(ownerId || drivewayId || renterId)){
            return res.status(400).json({message : "invalid id"})
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


export async function getBookingById(req:Request, res:Response){

}

export async function getAllBookings(req:Request, res:Response){

}

export async function updateBookingById(req:Request, res:Response){

}

export async function deleteBookingById(req:Request, res:Response){

}   