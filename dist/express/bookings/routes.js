"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const authenticateToken_1 = require("../../utils/middleware/authenticateToken");
const ownershipMiddleware_1 = require("../../utils/middleware/ownershipMiddleware");
const rateLimit_1 = require("../../utils/middleware/rateLimit");
const bookingRouter = express_1.default.Router();
bookingRouter.post('/', authenticateToken_1.authenticateToken, rateLimit_1.bookingRateLimit, controller_1.addBooking);
bookingRouter.post('/createPaymentIntent', authenticateToken_1.authenticateToken, controller_1.createPaymentIntent); // doesnt follow responseWrapper
bookingRouter.get('/:userId', authenticateToken_1.authenticateToken, controller_1.getBookingsByRenterId);
bookingRouter.get('/checkIfUserHasBookings/:userId', authenticateToken_1.authenticateToken, ownershipMiddleware_1.requireUserOwnership, controller_1.checkIfUserHasBooking);
bookingRouter.delete('/:bookingId', controller_1.deleteBookingById); // doesnt follow responseWrapper 
bookingRouter.post('/cancelBooking', controller_1.cancelBooking); //  same
exports.default = bookingRouter;
