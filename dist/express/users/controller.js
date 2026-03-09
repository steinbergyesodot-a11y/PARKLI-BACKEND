"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUser = addUser;
exports.getUserById = getUserById;
exports.getAllUsers = getAllUsers;
exports.deleteUserById = deleteUserById;
exports.updateFirstName = updateFirstName;
exports.updateLastName = updateLastName;
exports.updateEmail = updateEmail;
exports.Login = Login;
exports.googleLogin = googleLogin;
exports.checkStripeStatus = checkStripeStatus;
const manager_1 = require("./manager");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const model_1 = require("./model");
const stripe_1 = __importDefault(require("stripe"));
const interface_1 = require("./interface");
const validation_1 = require("./validation");
const sanitizeHTML_1 = require("../../utils/sanitizeHTML");
const logger_1 = require("../../utils/logger/logger");
async function addUser(req, res, next) {
    console.log("POST using DB:", mongoose_1.default.connection.name);
    logger_1.logger.info({
        message: "addUser called",
        ip: req.ip
    });
    try {
        const data = validation_1.userSchemaZod.parse(req.body);
        const firstName = (0, sanitizeHTML_1.clean)(data.firstName);
        const lastName = (0, sanitizeHTML_1.clean)(data.lastName);
        const email = (0, sanitizeHTML_1.clean)(data.email);
        logger_1.logger.info({
            message: "Attempting to create user",
            email,
            ip: req.ip
        });
        const exists = await model_1.userModel.findOne({ email });
        if (exists) {
            logger_1.logger.warn({
                message: "User creation failed: email already exists",
                email,
                ip: req.ip
            });
            return next(new Error("Unable to create account"));
        }
        const hashedPassword = await bcrypt_1.default.hash(data.password, 12);
        await manager_1.UsersManager.createUser({
            firstName,
            lastName,
            email,
            userType: interface_1.UserType.Guest,
            password: hashedPassword,
            roles: ["renter"],
        });
        logger_1.logger.info({
            message: "User created successfully",
            email,
            ip: req.ip
        });
        return res.status(201).json({
            message: "Created user successfully!",
        });
    }
    catch (err) {
        logger_1.logger.error({
            message: "Error in addUser",
            error: err.message,
            stack: err.stack,
            ip: req.ip
        });
        return next(err);
    }
}
async function getUserById(req, res, next) {
    const userId = req.params.userId;
    logger_1.logger.info({
        message: "getUserById called",
        userId,
        ip: req.ip
    });
    if (!userId) {
        logger_1.logger.warn({
            message: "Missing user ID",
            ip: req.ip
        });
        return next(new Error("Missing user ID."));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        logger_1.logger.warn({
            message: "Invalid userId format",
            userId,
            ip: req.ip
        });
        return next(new Error("Invalid userId format."));
    }
    try {
        const user = await manager_1.UsersManager.getUserById(userId);
        if (!user) {
            logger_1.logger.warn({
                message: "User not found",
                userId,
                ip: req.ip
            });
            throw new Error("User not found");
        }
        logger_1.logger.info({
            message: "User fetched successfully",
            userId
        });
        return res.status(200).json({ user });
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getUserById",
            error: error.message,
            stack: error.stack,
            userId
        });
        next(error);
    }
}
async function getAllUsers(req, res, next) {
    logger_1.logger.info({
        message: "getAllUsers called",
        ip: req.ip
    });
    try {
        const users = await manager_1.UsersManager.getAllUsers();
        if (users.length === 0) {
            logger_1.logger.warn({
                message: "No users found",
                ip: req.ip
            });
            return next(new Error("Couldn't find any users"));
        }
        logger_1.logger.info({
            message: "Users fetched successfully",
            count: users.length,
            ip: req.ip
        });
        return res.status(200).json({ "found users": users });
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getAllUsers",
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        next(error);
    }
}
async function deleteUserById(req, res) {
}
async function updateFirstName(req, res, next) {
    const userId = req.params.userId;
    const firstName = req.params.firstName;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user id format"));
    }
    if (!firstName) {
        return next(new Error("missing user first name"));
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { firstName: firstName }, { new: true });
        res.status(201).json({
            message: "updated Name",
            updatedUser
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateLastName(req, res, next) {
    const userId = req.params.userId;
    const lastName = req.params.lastName;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user id format"));
    }
    if (!lastName) {
        return next(new Error("missing user last name"));
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { lastName: lastName }, { new: true });
        res.status(201).json({
            message: "updated Name",
            updatedUser
        });
    }
    catch (error) {
        next(error);
    }
}
async function updateEmail(req, res, next) {
    const userId = req.params.userId;
    const email = req.params.email;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user id format"));
    }
    if (!email) {
        return next(new Error("missing user first name"));
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { email: email }, { new: true });
        res.status(201).json({
            message: "updated email address",
            updatedUser
        });
    }
    catch (error) {
        next(error);
    }
}
async function Login(req, res, next) {
    const { email, password } = validation_1.loginSchemaZod.parse(req.body);
    // Log the incoming login attempt
    logger_1.logger.info({
        message: "Login attempt",
        email,
        ip: req.ip
    });
    try {
        const userFound = await manager_1.UsersManager.Login(email, password);
        if (userFound.success === false) {
            logger_1.logger.warn({
                message: "Login failed: invalid credentials",
                email,
                ip: req.ip
            });
            return next(new Error("Email or password invalid!"));
        }
        if (!userFound.success || !userFound.user) {
            logger_1.logger.warn({
                message: "Login failed: user object missing",
                email,
                ip: req.ip
            });
            return next(new Error("Email or password invalid!"));
        }
        const payload = {
            firstName: userFound.user.firstName,
            lastName: userFound.user.lastName,
            _id: userFound.user._id,
            roles: userFound.user.roles,
            email: userFound.user.email,
            drivewayIds: userFound.user.drivewayIds,
            authProvider: userFound.user.authProvider
        };
        if (!process.env.JWT_SECRET_KEY) {
            logger_1.logger.error({
                message: "JWT secret missing",
                email,
                ip: req.ip
            });
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h"
        });
        logger_1.logger.info({
            message: "Login successful",
            email,
            userId: userFound.user._id,
            ip: req.ip
        });
        return res.status(200).json({
            message: "Login successful",
            token,
            payload
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in Login endpoint",
            error: error.message,
            stack: error.stack,
            email,
            ip: req.ip
        });
        next(error);
    }
}
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function googleLogin(req, res, next) {
    var _a;
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return next(new Error("missing access token"));
        }
        // 1. Verify Google token
        const ticket = await client.getTokenInfo(accessToken);
        const email = ticket.email;
        const googleId = ticket.sub;
        // 2. Check if user exists in your DB
        let user = await model_1.userModel.findOne({ email });
        const firstName = (_a = email === null || email === void 0 ? void 0 : email.split("@")[0]) !== null && _a !== void 0 ? _a : "unknown";
        // 3. If not, create a new user automatically
        if (!user) {
            user = await model_1.userModel.create({
                firstName,
                email,
                googleId,
                roles: ["renter"],
                userType: interface_1.UserType.Guest,
                drivewayIds: [],
                authProvider: "google"
            });
        }
        // 4. Build the SAME payload as your normal login
        const payload = {
            name: user.firstName,
            _id: user._id,
            roles: user.roles,
            email: user.email,
            drivewayIds: user.drivewayIds,
            authProvider: "google"
        };
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error("JWT_SECRET_KEY is not defined");
        }
        // 5. Create the SAME JWT as your normal login
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h"
        });
        // 6. Send it back
        return res.status(200).json({
            message: "Google login successful",
            token,
            payload
        });
    }
    catch (error) {
        next(error);
    }
}
async function checkStripeStatus(req, res, next) {
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    try {
        const userId = req.user._id;
        const user = await model_1.userModel.findById(userId);
        if (!user || !user.stripeAccountId) {
            return res.json({ verified: false });
        }
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        const verified = account.details_submitted &&
            account.charges_enabled &&
            account.payouts_enabled;
        if (verified && !user.isStripeVerified) {
            user.isStripeVerified = true;
            await user.save();
        }
        return res.json({ verified });
    }
    catch (err) {
        next(err);
    }
}
