import { Request, Response, NextFunction } from "express";
import axios from "axios";

export async function verifyTurnstile(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA token missing"
      });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Turnstile secret key not configured");
    }

    // Verify with Cloudflare
    const result = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: req.ip || ""
      })
    );

    if (!result.data.success) {
      return res.status(403).json({
        success: false,
        message: "CAPTCHA verification failed"
      });
    }

    next();
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return res.status(500).json({
      success: false,
      message: "CAPTCHA verification error"
    });
  }
}
