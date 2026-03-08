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
            const isMatch = await bcrypt_1.default.compare(password, user.password || "");
            if (!isMatch) {
                return { success: false, message: "Invalid credentials" };
            }
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
