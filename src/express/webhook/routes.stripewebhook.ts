import express from "express";
import { stripeWebhookController } from "./stripewebhookcontroller";

const routerWeb = express.Router();

routerWeb.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

export default routerWeb;
