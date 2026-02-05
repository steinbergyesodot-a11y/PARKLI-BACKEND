"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const bookingRouter = express_1.default.Router();
bookingRouter.post('/', controller_1.addBooking);
bookingRouter.post('/createPaymentIntent', controller_1.createPaymentIntent);
bookingRouter.get('/:renterId', controller_1.getBookingByRenterId);
bookingRouter.get('/checkIfUserHasBookings/:userId', controller_1.checkIfUserHasBooking);
bookingRouter.get('/', controller_1.getAllBookings);
bookingRouter.put('/:bookingId', controller_1.updateBookingById);
bookingRouter.delete('/:bookingId', controller_1.deleteBookingById);
exports.default = bookingRouter;
