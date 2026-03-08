"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripewebhookcontroller_1 = require("./stripewebhookcontroller");
const routerWeb = express_1.default.Router();
routerWeb.post("/webhook", express_1.default.raw({ type: "application/json" }), stripewebhookcontroller_1.stripeWebhookController);
exports.default = routerWeb;
