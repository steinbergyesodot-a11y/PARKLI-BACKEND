import express from 'express'
import {Router} from 'express'
import { addBooking, getBookingsByRenterId, deleteBookingById,checkIfUserHasBooking, createPaymentIntent, cancelBooking } from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { requireUserOwnership,requireDrivewayOwnership } from '../../utils/middleware/ownershipMiddleware';
import { bookingRateLimit } from '../../utils/middleware/rateLimit';


const bookingRouter = express.Router();

bookingRouter.post('/',authenticateToken,bookingRateLimit,addBooking)

bookingRouter.post('/createPaymentIntent',authenticateToken,createPaymentIntent) // doesnt follow responseWrapper

bookingRouter.get('/:userId',authenticateToken,getBookingsByRenterId)

bookingRouter.get('/checkIfUserHasBookings/:userId',authenticateToken,requireUserOwnership,checkIfUserHasBooking)

bookingRouter.delete('/:bookingId',deleteBookingById)   // doesnt follow responseWrapper 

bookingRouter.post('/cancelBooking',cancelBooking)      //  same





export default bookingRouter;