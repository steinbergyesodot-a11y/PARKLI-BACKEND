"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupRateLimitByIP = signupRateLimitByIP;
const rateLimitStore = new Map();
function signupRateLimitByIP(limit, windowMs) {
    return (req, res, next) => {
        var _a;
        const ip = (_a = req.ip) !== null && _a !== void 0 ? _a : "unknown"; // <-- FIXED HERE
        const now = Date.now();
        let record = rateLimitStore.get(ip);
        if (!record) {
            rateLimitStore.set(ip, { count: 1, firstAttempt: now });
            return next();
        }
        const timePassed = now - record.firstAttempt;
        if (timePassed > windowMs) {
            record.count = 1;
            record.firstAttempt = now;
            return next();
        }
        record.count++;
        if (record.count > limit) {
            return res.status(429).json({
                success: false,
                message: "Too many signup attempts. Try again later."
            });
        }
        next();
    };
}
