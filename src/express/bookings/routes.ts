import express from 'express'
import {Router} from 'express'
import { addBooking, getAllBookings, getBookingById, updateBookingById, deleteBookingById } from './controller';



const bookingRouter = express.Router();




bookingRouter.post('/',addBooking)

bookingRouter.get('/:bookingId',getBookingById)

bookingRouter.get('/',getAllBookings)

bookingRouter.put('/:bookingId',updateBookingById)

bookingRouter.delete('/:deleteBookingById',deleteBookingById)



export default bookingRouter;