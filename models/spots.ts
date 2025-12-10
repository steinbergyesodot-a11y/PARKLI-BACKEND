import mongoose from "mongoose"


export const spots = new mongoose.Schema({
    userId: {type: mongoose.Types.ObjectId, ref:"User",required:true},
    address: {type: String, required: true},
    walk: {type:String, required:true},
    stadium: {type: String, required: true},
    price: {type: Number},
    image: {type: String},
    description: {type:String},
    PostedAt: {type: Date, default: Date.now}
})

const Spot = mongoose.model('Spots',spots)

export default Spot


