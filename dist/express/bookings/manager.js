"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingManager = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const model_1 = require("./model");
class BookingManager {
    static async createBooking(booking) {
        return model_1.BookingModel.create(booking);
    }
    // static async findDrivewayById(drivewayId : string){
    //     return await BookingModel.findById(drivewayId)
    // }
    static async getBookingsByRenterId(renterId) {
        try {
            const renterObjectId = new mongoose_1.default.Types.ObjectId(renterId);
            const bookings = await model_1.BookingModel.find({ renterId: renterObjectId });
            return bookings;
        }
        catch (error) {
            console.error("Error fetching bookings:", error);
            throw error;
        }
    }
    static async deleteBookingById(bookingId) {
        const deletedBooking = await model_1.BookingModel.findByIdAndDelete(bookingId);
        return deletedBooking;
    }
}
exports.BookingManager = BookingManager;
