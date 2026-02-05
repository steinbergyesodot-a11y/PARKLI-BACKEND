"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
    authProvider: { type: String, default: "local" }
});
exports.userModel = mongoose_1.default.model('user', userSchema);
