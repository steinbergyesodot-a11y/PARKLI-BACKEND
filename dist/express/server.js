"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// import errorHandler from '../../middleware/errorHandler';
const cors_1 = __importDefault(require("cors"));
const __1 = __importDefault(require(".."));
const router_1 = require("./router");
const routes_stripewebhook_1 = __importDefault(require("./webhook/routes.stripewebhook"));
dotenv_1.default.config();
(0, __1.default)();
const PORT = process.env.PORT || 3000;
const app = (0, express_1.default)();
app.use("/api/stripe", routes_stripewebhook_1.default);
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(router_1.appRouter);
// app.use(errorHandler)
app.listen(PORT, () => {
    console.log(`server running on port: ${PORT}`);
});
