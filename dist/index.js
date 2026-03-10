"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connect = async () => {
    console.log("DATABASE_URI from Render:", JSON.stringify(process.env.DATABASE_URI));
    const dbURL = process.env.DATABASE_URI;
    if (!dbURL) {
        throw new Error('error');
    }
    mongoose_1.default.connection.on("error", err => {
        console.error("❌ Mongoose runtime error:", err);
    });
    try {
        console.log("ENV DATABASE_URI:", process.env.DATABASE_URI);
        await mongoose_1.default.connect(dbURL);
        console.log("Connected to MongoDB:", process.env.DATABASE_URI);
    }
    catch (error) {
        console.error("❌ MongoDB connection error:");
        console.error(error);
    }
};
exports.default = connect;
