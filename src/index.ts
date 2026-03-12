import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connect = async () => {

    const dbURL = process.env.DATABASE_URI
    if(!dbURL){
        throw new Error('error')
    }
    mongoose.connection.on("error", err => {
});

    try{
        console.log("ENV DATABASE_URI:", process.env.DATABASE_URI);

        await mongoose.connect(dbURL)
        console.log("Connected DB:", mongoose.connection.name)

    }catch(error){
        console.error("❌ MongoDB connection error:");
    console.error(error);
    }

}

export default connect
