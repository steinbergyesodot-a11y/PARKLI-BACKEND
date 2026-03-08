"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const interface_1 = require("./interface");
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false,
        min: 5
    },
    userType: {
        type: String,
        enum: Object.values(interface_1.UserType),
        default: interface_1.UserType.Guest,
        required: true
    },
    roles: {
        type: [String],
        enum: ["renter", "host"],
        default: ["renter"]
    },
    stripeAccountId: {
        type: String,
        required: false
    },
    isStripeVerified: {
        type: Boolean,
        required: false
    },
    drivewayIds: {
        type: [String],
    },
    googleId: String,
    authProvider: { type: String, default: "local" },
    failedAttempts: { type: Number, default: 0, required: false },
    lastFailedAttempt: { type: Date, default: null, required: false }
});
exports.userModel = mongoose_1.default.model('user', userSchema);
