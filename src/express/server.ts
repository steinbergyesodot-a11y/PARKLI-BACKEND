import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import connect from '../index'
import { appRouter } from "./router";
import routerWeb from "./webhook/routes.stripewebhook";
import errorHandler from "../utils/middleware/errorHandler";
import { logger } from "../utils/logger/logger";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

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

// 6️⃣ Error handling middleware for Sentry
app.use((err: any, req: any, res: any, next: any) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Server running on port: ${PORT}`);
});
