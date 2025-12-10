import mongoose, { Schema } from 'mongoose'
import { IDriveway } from './interfce';


const drivewaySchema = new mongoose.Schema<IDriveway>({
    ownerId: {
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true
    },
     walk: {
        type: String,
        required: true
    },
     stadium: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String
    },
    description: {
        type: String
    }

   
})

export const drivewayModel = mongoose.model<IDriveway>('driveway', drivewaySchema);