"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitBookingCreated = emitBookingCreated;
exports.emitBookingCancelled = emitBookingCancelled;
const events_1 = require("events");
const emailService = __importStar(require("./emailService"));
const logger_1 = require("../logger/logger");
const emailEmitter = new events_1.EventEmitter();
// Listen for booking created event
emailEmitter.on('bookingCreated', async (data) => {
    try {
        await emailService.sendBookingConfirmationEmail(data.renterId, data.bookingId);
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Error handling bookingCreated event',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Listen for booking cancelled event
emailEmitter.on('bookingCancelled', async (data) => {
    try {
        await emailService.sendBookingCancelledEmail(data.renterId, data.bookingId);
    }
    catch (error) {
        logger_1.logger.error({
            message: 'Error handling bookingCancelled event',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
function emitBookingCreated(renterId, bookingId) {
    emailEmitter.emit('bookingCreated', { renterId, bookingId });
}
function emitBookingCancelled(renterId, bookingId) {
    emailEmitter.emit('bookingCancelled', { renterId, bookingId });
}
