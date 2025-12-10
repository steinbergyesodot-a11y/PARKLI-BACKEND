import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import spotsRouter from '../../routes/spotRoutes';
import errorHandler from '../../middleware/errorHandler';
import usersRouter from '../../routes/userRoutes';
import cors from 'cors';
import multer from 'multer'
import connect from '..';


dotenv.config();

connect();

const PORT = process.env.PORT || 3000

const app = express();

app.use(express.json());

app.use(cors());

app.use('/spots',spotsRouter)

app.use('/users',usersRouter)

app.use(errorHandler)



app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`)
})
