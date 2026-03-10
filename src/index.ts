import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connect = async () => {
    console.log("DATABASE_URI from Render:", JSON.stringify(process.env.DATABASE_URI));

    const dbURL = process.env.DATABASE_URI
    if(!dbURL){
        throw new Error('error')
    }
    mongoose.connection.on("error", err => {
    console.error("❌ Mongoose runtime error:", err);
});

    try{
        console.log("ENV DATABASE_URI:", process.env.DATABASE_URI);

        await mongoose.connect(dbURL)
        

        console.log("Connected to MongoDB:", process.env.DATABASE_URI);

    }catch(error){
        console.error("❌ MongoDB connection error:");
    console.error(error);
    }

}

export default connect
