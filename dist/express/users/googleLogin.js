"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const model_1 = require("./model");
const router = express_1.default.Router();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
router.post("/google-login", async (req, res) => {
    try {
        const { accessToken } = req.body;
        const ticket = await client.getTokenInfo(accessToken);
        const email = ticket.email;
        const googleId = ticket.sub;
        if (!email) {
            return res.status(400).json({ message: "Google token missing email" });
        }
        let user = await model_1.userModel.findOne({ email });
        if (!user) {
            // create user with firstName / lastName like your normal users
            const baseName = email.split("@")[0];
            user = await model_1.userModel.create({
                firstName: baseName,
                lastName: "",
                email,
                googleId,
                authProvider: "google",
                roles: ["renter"], // or whatever default you use
                drivewayIds: []
            });
        }
        // ✅ SAME payload as normal login
        const payload = {
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id,
            roles: user.roles,
            email: user.email,
            drivewayIds: user.drivewayIds
        };
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({ token, payload });
    }
    catch (err) {
        console.error("Google login failed:", err);
        res.status(400).json({ message: "Google login failed" });
    }
});
exports.default = router;
