import express from 'express'
import {Router} from 'express'
import { addBooking, getAllBookings, getBookingByRenterId, updateBookingById, deleteBookingById } from './controller';



const bookingRouter = express.Router();




bookingRouter.post('/',addBooking)

bookingRouter.get('/:renterId',getBookingByRenterId)

bookingRouter.get('/',getAllBookings)

bookingRouter.put('/:bookingId',updateBookingById)

bookingRouter.delete('/:bookingId',deleteBookingById)





export default bookingRouter;