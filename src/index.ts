import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connect = async () => {
    const dbURL = process.env.DATABASE_URI
    if(!dbURL){
        throw new Error('error')
    }
    try{
        await mongoose.connect(dbURL)
        

        console.log("Connected to MongoDB:", process.env.DATABASE_URI);

    }catch(error){
        console.log(error)
    }

}

export default connect
