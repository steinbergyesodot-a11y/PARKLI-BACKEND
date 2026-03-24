import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 requests per window
  message: "Too many login attempts. Try again later.",
  standardHeaders: true, // adds RateLimit-* headers
  legacyHeaders: false,
});


export const bookingRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                     // limit each IP to 5 bookings per minute
  message: "Too many bookings from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

