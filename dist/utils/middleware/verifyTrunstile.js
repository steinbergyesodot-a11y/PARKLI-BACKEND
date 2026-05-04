"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTurnstile = verifyTurnstile;
const axios_1 = __importDefault(require("axios"));
async function verifyTurnstile(req, res, next) {
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
        const result = await axios_1.default.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", new URLSearchParams({
            secret: secretKey,
            response: token,
            remoteip: req.ip || ""
        }), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        if (!result.data.success) {
            return res.status(403).json({
                success: false,
                message: "CAPTCHA verification failed"
            });
        }
        next();
    }
    catch (err) {
        console.error("Turnstile verification error:", err);
        return res.status(500).json({
            success: false,
            message: "CAPTCHA verification error"
        });
    }
}
