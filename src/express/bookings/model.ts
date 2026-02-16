import mongoose, { Schema } from 'mongoose'
import { IBooking } from './interface';








const BookingSchema = new mongoose.Schema<IBooking>({
   
    drivewayId: {
         type: Schema.Types.ObjectId, 
         ref: 'Driveway',
         required: true
    },
    ownerId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    renterId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    address: { type: String, required: true },
    gameDate: { type: String, required: true },
    parkingTime: { type: String, required: true },
    cancelBy: {type: String, required: true},
    price: { type: Number, required: true},
    visiting_team: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now }
})
   


export const BookingModel = mongoose.model<IBooking>('Booking', BookingSchema);