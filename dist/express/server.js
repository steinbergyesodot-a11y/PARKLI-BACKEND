"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const Sentry = __importStar(require("@sentry/node"));
const index_1 = __importDefault(require("../index"));
const router_1 = require("./router");
const routes_stripewebhook_1 = __importDefault(require("./webhook/routes.stripewebhook"));
const errorHandler_1 = __importDefault(require("../utils/middleware/errorHandler"));
const logger_1 = require("../utils/logger/logger");
dotenv_1.default.config();
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: 1.0,
    });
}
(0, index_1.default)();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
// 1️⃣ CORS FIRST
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5173",
        "https://parkli-front.vercel.app"
    ],
    credentials: true
}));
// 2️⃣ HELMET - Security headers
app.use((0, helmet_1.default)());
// 3️⃣ Stripe webhook BEFORE express.json()
app.use("/api/stripe", routes_stripewebhook_1.default);
// 4️⃣ JSON parser AFTER webhook
app.use(express_1.default.json());
// 5️⃣ Your normal API routes
app.use(router_1.appRouter);
// 6️⃣ Error handling middleware for Sentry
app.use((err, req, res, next) => {
    if (process.env.SENTRY_DSN) {
        Sentry.captureException(err);
    }
    logger_1.logger.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});
app.use(errorHandler_1.default);
app.listen(PORT, () => {
    logger_1.logger.info(`Server running on port: ${PORT}`);
});
