import mongoose from "mongoose";
import { IBooking } from "./interface";
import { BookingModel } from "./model";

export class BookingManager{
    static async createBooking(booking : IBooking){
         return BookingModel.create(booking)
    } 

    // static async findDrivewayById(drivewayId : string){
    //     return await BookingModel.findById(drivewayId)
    // }

       static async getBookingsByRenterId(renterId : string){
        try{
            const renterObjectId = new mongoose.Types.ObjectId(renterId);
            const bookings = await BookingModel.find({ renterId: renterObjectId });
            return bookings;

        }catch(error){
            console.error("Error fetching bookings:", error); 
            throw error;
        }
       }

    // static async getAllDriveways(){
    //     const driveways = await drivewayModel.find()
    //     return driveways
    // }
    
}