import mongoose, { Schema } from 'mongoose'
import { IUser,UserType } from './interface';
import { number } from 'zod';


const userSchema = new mongoose.Schema<IUser>({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: false
    },
     email: {
        type: String,
        required: true
    },
     password: {
        type: String,
        required: false,
        min: 5
    },
    userType: { 
        type: String,
         enum: Object.values(UserType), 
         default: UserType.Guest,
        required: true 
    },
     roles:{
        type:[String],
        enum: ["renter", "host"],
        default: ["renter"]
    },
    stripeAccountId:{
        type:String,
        required:false
    },
    isStripeVerified:{
        type: Boolean,
        required:false
    },
    drivewayIds: {
        type: [String],
    },
    googleId: String,
    authProvider: { type: String, default: "local" },
    failedAttempts: { type: Number, default: 0 , required: false},
    lastFailedAttempt: { type: Date, default: null, required: false },
    lockoutUntil: { type: Date, default: null, required: false },
    stripeOnboardingUrl: {type: String, required: false},
    stripeOnboardingUrlExpires: {type: Date, required: false},
    passwordResetToken: {type: String, required: false},
    passwordResetExpires: {type: Number,required: false}

  
   
})

export const userModel = mongoose.model<IUser>('user', userSchema);