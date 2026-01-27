import mongoose, { Schema } from 'mongoose'
import { IDriveway,IGame} from './interfce';




const GameSchema = new Schema<IGame>({
    visiting_team: {type: String, required: true},
    game_time: {type: String, required: true},
    date : {type: String, required: true},
    booked: {type: Boolean, required: false},
    blocked: {type: Boolean, required:true,default:false}
})




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
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String]
    },
    description: {
        type: String
    },
    rules: {
        type: [String]
    },
    games:{
      type: [GameSchema],
      default: []
     
    }
  

   
})

export const drivewayModel = mongoose.model<IDriveway>('driveway', drivewaySchema);