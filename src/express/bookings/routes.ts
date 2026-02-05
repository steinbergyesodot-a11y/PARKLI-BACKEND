import express from 'express'
import {Router} from 'express'
import { addBooking, getAllBookings, getBookingByRenterId, updateBookingById, deleteBookingById,checkIfUserHasBooking, createPaymentIntent } from './controller';



const bookingRouter = express.Router();




bookingRouter.post('/',addBooking)

bookingRouter.post('/createPaymentIntent',createPaymentIntent)

bookingRouter.get('/:renterId',getBookingByRenterId)

bookingRouter.get('/checkIfUserHasBookings/:userId',checkIfUserHasBooking)

bookingRouter.get('/',getAllBookings)

bookingRouter.put('/:bookingId',updateBookingById)

bookingRouter.delete('/:bookingId',deleteBookingById)





export default bookingRouter;