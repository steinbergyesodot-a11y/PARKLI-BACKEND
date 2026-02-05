import express from "express";
import { stripeWebhookController } from "./stripewebhookcontroller";

const routerWeb = express.Router();

// IMPORTANT: raw body middleware is applied HERE, not globally
routerWeb.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

export default routerWeb;
