import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config();

const connect = async () => {
    const dbURL = "mongodb+srv://yosefsteinberg:20155775@cluster0.om22ofs.mongodb.net/"
    if(!dbURL){
        throw new Error('error')
    }
    try{
        await mongoose.connect(dbURL)
        

        console.log('connected!')
    }catch(error){
        console.log(error)
    }

}

export default connect
