import express from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google-login", async (req, res) => {
  try {
    const { accessToken } = req.body;

    // 1. Verify token with Google
    const ticket = await client.getTokenInfo(accessToken);

    const email = ticket.email;
    const googleId = ticket.sub;

    // 2. Check if user exists
    let user = await User.findOne({ email });

    // 3. If not, create user
    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email,
        googleId,
        authProvider: "google"
      });
    }

    // 4. Create your JWT
    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Send token back
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Google login failed" });
  }
});

export default router;
