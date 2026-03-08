import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connect = async () => {
    const dbURL = process.env.DATABASE_URI
    if(!dbURL){
        throw new Error('error')
    }
    mongoose.connection.on("error", err => {
    console.error("❌ Mongoose runtime error:", err);
});

    try{
        await mongoose.connect(dbURL)
        

        console.log("Connected to MongoDB:", process.env.DATABASE_URI);

    }catch(error){
        console.error("❌ MongoDB connection error:");
    console.error(error);
    }

}

export default connect
