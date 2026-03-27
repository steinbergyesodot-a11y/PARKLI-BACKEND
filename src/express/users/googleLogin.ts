import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { userModel } from "./model";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", async (req, res) => {
  try {
    const { accessToken } = req.body;

    const ticket = await client.getTokenInfo(accessToken);

    const email = ticket.email;
    const googleId = ticket.sub;

    if (!email) {
      return res.status(400).json({ message: "Google token missing email" });
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      // create user with firstName / lastName like your normal users
      const baseName = email.split("@")[0];

      user = await userModel.create({
        firstName: baseName,
        lastName: "",
        email,
        googleId,
        authProvider: "google",
        roles: ["renter"],     // or whatever default you use
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

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, payload });

  } catch (err) {
    console.error("Google login failed:", err);
    res.status(400).json({ message: "Google login failed" });
  }
});

export default router;
