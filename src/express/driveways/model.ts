import mongoose, { Schema } from 'mongoose'
import { IDriveway,IGame} from './interfce';




const GameSchema = new Schema<IGame>({
    visiting_team: {type: String, required: true},
    game_time: {type: String, required: true},
    parkingBegins: {type:String,required: true},
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
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipcode: {
        type: String,
        required: false
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
        default: "My Driveway"
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
    isStripeVerified: {
        type: Boolean,
        default: false
    },
    games: {
        type: [GameSchema],
        default: []
    }
});

// Virtual field for publicDisplay
drivewaySchema.virtual('publicDisplay').get(function() {
    return `${this.city}, ${this.state} ${this.zipcode}`;
});

// Include virtuals in JSON output
drivewaySchema.set('toJSON', { virtuals: true });
drivewaySchema.set('toObject', { virtuals: true });

export const drivewayModel = mongoose.model<IDriveway>('driveway', drivewaySchema);