import express from 'express'
import {Router} from 'express'
import { addBooking, getBookingByRenterId, deleteBookingById,checkIfUserHasBooking, createPaymentIntent, cancelBooking } from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { requireUserOwnership,requireDrivewayOwnership } from '../../utils/middleware/ownershipMiddleware';


const bookingRouter = express.Router();

bookingRouter.post('/',authenticateToken,addBooking)

bookingRouter.post('/createPaymentIntent',authenticateToken,createPaymentIntent)

bookingRouter.get('/:userId',authenticateToken,requireUserOwnership,getBookingByRenterId)

bookingRouter.get('/checkIfUserHasBookings/:userId',authenticateToken,requireUserOwnership,checkIfUserHasBooking)

bookingRouter.delete('/:bookingId',deleteBookingById)

bookingRouter.post('/cancelBooking',cancelBooking)





export default bookingRouter;