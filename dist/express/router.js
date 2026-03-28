"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const express_1 = require("express");
const config_1 = require("../config");
const routes_1 = __importDefault(require("./driveways/routes"));
const routes_2 = __importDefault(require("./users/routes"));
const routes_3 = __importDefault(require("./bookings/routes"));
exports.appRouter = (0, express_1.Router)();
exports.appRouter.use(config_1.config.driveways.baseRoute, routes_1.default);
exports.appRouter.use(config_1.config.users.baseRoute, routes_2.default);
exports.appRouter.use(config_1.config.bookings.baseRoute, routes_3.default);
exports.appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});
// Test Sentry error tracking
exports.appRouter.get('/test-error', (_req, _res, next) => {
    next(new Error('This is a test error for Sentry'));
});
