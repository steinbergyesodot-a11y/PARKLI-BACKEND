"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger/logger");
dotenv_1.default.config();
const connect = async () => {
    const dbURL = process.env.DATABASE_URI;
    if (!dbURL) {
        throw new Error('error');
    }
    mongoose_1.default.connection.on("error", err => {
    });
    try {
        logger_1.logger.debug(`ENV DATABASE_URI: ${process.env.DATABASE_URI}`);
        await mongoose_1.default.connect(dbURL);
        logger_1.logger.info(`Connected DB: ${mongoose_1.default.connection.name}`);
    }
    catch (error) {
        logger_1.logger.error("MongoDB connection error:", error);
    }
};
exports.default = connect;
