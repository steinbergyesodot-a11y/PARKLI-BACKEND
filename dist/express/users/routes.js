"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const usersRouter = express_1.default.Router();
usersRouter.post("/addUser", controller_1.addUser);
usersRouter.get("/:userId", controller_1.getUserById);
usersRouter.put("/:userId/firstName/:firstName", controller_1.updateFirstName);
usersRouter.put("/:userId/lastName/:lastName", controller_1.updateLastName);
usersRouter.put("/:userId/email/:email", controller_1.updateEmail);
usersRouter.get("/", controller_1.getAllUsers);
usersRouter.post('/login', controller_1.Login);
usersRouter.post('/google-login', controller_1.googleLogin);
usersRouter.get('/stripe/onboarding/complete', controller_1.completeStripeOnboarding);
exports.default = usersRouter;
