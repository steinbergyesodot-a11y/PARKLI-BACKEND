import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv'
// import errorHandler from '../../middleware/errorHandler';
import cors from 'cors';
import multer from 'multer'
import connect from '..';
import { appRouter } from './router';
import routerWeb from './webhook/routes.stripewebhook';



dotenv.config();

connect();

const PORT = process.env.PORT || 3000

const app = express();

app.use("/api/stripe", routerWeb);

app.use(express.json());

app.use(cors());

app.use(appRouter)



// app.use(errorHandler)



app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`)
    
})
