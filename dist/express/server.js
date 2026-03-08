"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const __1 = __importDefault(require(".."));
const router_1 = require("./router");
const routes_stripewebhook_1 = __importDefault(require("./webhook/routes.stripewebhook"));
const errorHandler_1 = __importDefault(require("../utils/middleware/errorHandler"));
dotenv_1.default.config();
(0, __1.default)();
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
// 2️⃣ Stripe webhook BEFORE express.json()
app.use("/api/stripe", routes_stripewebhook_1.default);
// 3️⃣ JSON parser AFTER webhook
app.use(express_1.default.json());
// 4️⃣ Your normal API routes
app.use(router_1.appRouter);
app.use(errorHandler_1.default);
app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`);
});
