import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { logger } from './utils/logger/logger'

dotenv.config();

const connect = async () => {

    const dbURL = process.env.DATABASE_URI
    if(!dbURL){
        throw new Error('error')
    }
    mongoose.connection.on("error", err => {
});

    try{
        logger.debug(`ENV DATABASE_URI: ${process.env.DATABASE_URI}`);

        await mongoose.connect(dbURL)
        logger.info(`Connected DB: ${mongoose.connection.name}`)

    }catch(error){
        logger.error("MongoDB connection error:", error);
    }

}

export default connect



