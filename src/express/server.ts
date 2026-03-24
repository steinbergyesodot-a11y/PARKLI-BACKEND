import 'express-async-errors';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connect from '../index'
import { appRouter } from "./router";
import routerWeb from "./webhook/routes.stripewebhook";
import errorHandler from "../utils/middleware/errorHandler";

dotenv.config();
connect();

const PORT = process.env.PORT || 3000;
const app = express();

// 1️⃣ CORS FIRST
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://parkli-front.vercel.app"
    ],
    credentials: true
  })
);

// 2️⃣ HELMET - Security headers
app.use(helmet());

// 3️⃣ Stripe webhook BEFORE express.json()
app.use("/api/stripe", routerWeb);

// 4️⃣ JSON parser AFTER webhook
app.use(express.json());

// 5️⃣ Your normal API routes
app.use(appRouter);

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`server running on port: ${PORT}`);
});
