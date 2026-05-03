import express from 'express'
import {Router} from 'express'
import { addBooking, getBookingsByRenterId,checkIfUserHasBooking, createPaymentIntent, cancelBooking } from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { requireUserOwnership,requireDrivewayOwnership, requireBookingOwnership } from '../../utils/middleware/ownershipMiddleware';
import { bookingRateLimit } from '../../utils/middleware/rateLimit';


const bookingRouter = express.Router();

bookingRouter.post('/',authenticateToken,bookingRateLimit,addBooking)

bookingRouter.post('/createPaymentIntent',authenticateToken,createPaymentIntent) 

bookingRouter.get('/:userId',authenticateToken,getBookingsByRenterId)

bookingRouter.get('/checkIfUserHasBookings/:userId',authenticateToken,requireUserOwnership,checkIfUserHasBooking)

bookingRouter.post('/cancelBooking',authenticateToken,requireBookingOwnership,cancelBooking)      // doesnt follow responseWrapper





export default bookingRouter;