"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersManager = void 0;
const model_1 = require("./model");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UsersManager {
    static async createUser(user) {
        return model_1.userModel.create(user);
    }
    static async getUserById(userId) {
        const user = await model_1.userModel.findById(userId);
        return user;
    }
    static async getAllUsers() {
        const users = await model_1.userModel.find();
        return users;
    }
    static async Login(email, password) {
        try {
            const user = await model_1.userModel.findOne({ email });
            if (!user) {
                return { success: false, message: "Invalid credentials" };
            }
            // Check if account is locked
            if (user.lockoutUntil && new Date() < user.lockoutUntil) {
                const minutesRemaining = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
                return {
                    success: false,
                    message: `Account locked. Try again in ${minutesRemaining} minutes.`,
                    isLocked: true
                };
            }
            // Clear lockout if time has passed
            if (user.lockoutUntil && new Date() >= user.lockoutUntil) {
                await model_1.userModel.updateOne({ _id: user._id }, { lockoutUntil: undefined, failedAttempts: 0 });
                user.lockoutUntil = undefined;
                user.failedAttempts = 0;
            }
            const isMatch = await bcrypt_1.default.compare(password, user.password || "");
            if (!isMatch) {
                // Increment failed attempts
                const newFailedAttempts = (user.failedAttempts || 0) + 1;
                const updateData = {
                    failedAttempts: newFailedAttempts,
                    lastFailedAttempt: new Date()
                };
                // Lock account after 5 failed attempts for 15 minutes
                if (newFailedAttempts >= 5) {
                    const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
                    updateData.lockoutUntil = lockoutUntil;
                }
                await model_1.userModel.updateOne({ _id: user._id }, updateData);
                return {
                    success: false,
                    message: "Invalid credentials",
                    failedAttempts: newFailedAttempts,
                    accountLocked: newFailedAttempts >= 5
                };
            }
            // Successful login - reset failed attempts
            await model_1.userModel.updateOne({ _id: user._id }, { failedAttempts: 0, lastFailedAttempt: null, lockoutUntil: null });
            return {
                success: true, user: user
            };
        }
        catch (error) {
            return {
                success: false, message: "Server error"
            };
        }
    }
}
exports.UsersManager = UsersManager;
