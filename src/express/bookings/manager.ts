import mongoose from "mongoose";
import { IBooking } from "./interface";
import { BookingModel } from "./model";
import { deleteBookingById } from "./controller";
import { logger } from "../../utils/logger/logger";

export class BookingManager{
        static async createBooking(booking : IBooking){
            return BookingModel.create(booking)
        } 

       static async getBookingsByRenterId(renterId : string){
        try{
            const renterObjectId = new mongoose.Types.ObjectId(renterId);
            const bookings = await BookingModel.find({ renterId: renterObjectId });
            return bookings;

        }catch(error){
            logger.error("Error fetching bookings:", error); 
            throw error;
        }
       }

        static async deleteBookingById(bookingId: string){
           const deletedBooking = await BookingModel.findByIdAndDelete(bookingId);
           return deletedBooking
       }
    
}