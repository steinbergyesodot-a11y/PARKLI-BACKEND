import { IBooking } from "./interface";
import { BookingModel } from "./model";

export class BookingManager{
    static async createBooking(booking : IBooking){
         return BookingModel.create(booking)
    } 

    // static async findDrivewayById(drivewayId : string){
    //     return await drivewayModel.findById(drivewayId)
    // }

    // static async getAllDriveways(){
    //     const driveways = await drivewayModel.find()
    //     return driveways
    // }
    
}