// rateLimitSignup.ts
import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function signupRateLimitByIP(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown"; // <-- FIXED HERE
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
