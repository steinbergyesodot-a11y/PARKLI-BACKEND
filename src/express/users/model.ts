import mongoose, { Schema } from 'mongoose'
import { IUser } from './interface';


const userSchema = new mongoose.Schema<IUser>({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
     email: {
        type: String,
        required: true
    },
     password: {
        type: String,
        required: true,
        min: 5
    },
    roles:{
        type:[String],
        enum: ["renter", "host"],
        default: ["renter"]
    },
    
    drivewayIds: {
        type: [String],
    }
  
   
})

export const userModel = mongoose.model<IUser>('user', userSchema);