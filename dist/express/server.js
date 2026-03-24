"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("../index"));
const router_1 = require("./router");
const routes_stripewebhook_1 = __importDefault(require("./webhook/routes.stripewebhook"));
const errorHandler_1 = __importDefault(require("../utils/middleware/errorHandler"));
dotenv_1.default.config();
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
app.use(errorHandler_1.default);
app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`);
});
