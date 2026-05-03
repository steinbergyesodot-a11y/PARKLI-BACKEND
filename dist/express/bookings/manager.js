"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingManager = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const model_1 = require("./model");
const logger_1 = require("../../utils/logger/logger");
class BookingManager {
    static async createBooking(booking) {
        return model_1.BookingModel.create(booking);
    }
    static async getBookingsByRenterId(renterId) {
        try {
            const renterObjectId = new mongoose_1.default.Types.ObjectId(renterId);
            const bookings = await model_1.BookingModel.find({ renterId: renterObjectId });
            return bookings;
        }
        catch (error) {
            logger_1.logger.error("Error fetching bookings:", error);
            throw error;
        }
    }
    static async deleteBookingById(bookingId) {
        const deletedBooking = await model_1.BookingModel.findByIdAndDelete(bookingId);
        return deletedBooking;
    }
}
exports.BookingManager = BookingManager;
