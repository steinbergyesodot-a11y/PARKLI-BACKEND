"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRateLimit = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // limit each IP to 5 requests per window
    message: "Too many login attempts. Try again later.",
    standardHeaders: true, // adds RateLimit-* headers
    legacyHeaders: false,
});
exports.bookingRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 bookings per minute
    message: "Too many bookings from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
