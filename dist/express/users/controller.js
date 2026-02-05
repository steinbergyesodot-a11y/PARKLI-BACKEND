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
exports.completeStripeOnboarding = completeStripeOnboarding;
const manager_1 = require("./manager");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const model_1 = require("./model");
const stripe_1 = __importDefault(require("stripe"));
async function addUser(req, res) {
    const { firstName, lastName, email, password, roles } = req.body ?? {};
    if (!firstName || !lastName || !email || !password || !roles) {
        return res.status(400).json({ Message: 'You`re missing parameters' });
    }
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await manager_1.UsersManager.createUser({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            roles
        });
        return res.status(201).json({
            Message: "Created user successfully!"
        });
    }
    catch (error) {
        return res.status(500).json({
            "error": error
        });
    }
}
async function getUserById(req, res) {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({ Message: "missing user Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return;
    }
    try {
        const user = await manager_1.UsersManager.getUserById(userId);
        if (user) {
            res.status(200).json({
                user
            });
        }
        else {
            return res.status(404).json({ message: "User not found." });
        }
    }
    catch (error) {
        res.status(500).json({
            error: "server error"
        });
    }
}
async function getAllUsers(req, res) {
    try {
        const users = await manager_1.UsersManager.getAllUsers();
        if (users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(500).json({
            error: "internal server error"
        });
    }
}
async function deleteUserById(req, res) {
}
async function updateFirstName(req, res) {
    const userId = req.params.userId;
    const firstName = req.params.firstName;
    if (!userId) {
        return res.status(400).json({ Message: "missing user Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return;
    }
    if (!firstName) {
        return res.status(400).json({ Message: "missing new name." });
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { firstName: firstName }, { new: true });
        res.status(201).json({
            message: "updated Name",
            updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            "error": error
        });
    }
}
async function updateLastName(req, res) {
    const userId = req.params.userId;
    const lastName = req.params.lastName;
    if (!userId) {
        return res.status(400).json({ Message: "missing user Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return;
    }
    if (!lastName) {
        return res.status(400).json({ Message: "missing new name." });
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { lastName: lastName }, { new: true });
        res.status(201).json({
            message: "updated Name",
            updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            "error": error
        });
    }
}
async function updateEmail(req, res) {
    const userId = req.params.userId;
    const email = req.params.email;
    if (!userId) {
        return res.status(400).json({ Message: "missing user Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid userId format" });
        return;
    }
    if (!email) {
        return res.status(400).json({ Message: "missing new email address." });
    }
    try {
        const updatedUser = await model_1.userModel.findByIdAndUpdate(userId, { email: email }, { new: true });
        res.status(201).json({
            message: "updated email address",
            updatedUser
        });
    }
    catch (error) {
        res.status(500).json({
            "error": error
        });
    }
}
async function Login(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const userFound = await manager_1.UsersManager.Login(email, password);
        if (userFound.success === false) {
            return res.status(400).json({
                message: "Email or password invalid!"
            });
        }
        if (!userFound.success || !userFound.user) {
            return res.status(400).json({
                message: "Email or password invalid!"
            });
        }
        const payload = {
            firstName: userFound.user?.firstName,
            lastName: userFound.user?.lastName,
            _id: userFound.user._id,
            roles: userFound.user.roles,
            email: userFound.user?.email,
            drivewayIds: userFound.user.drivewayIds,
            authProvider: userFound.user.authProvider
        };
        if (!process.env.JWT_SECRET_KEY) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h'
        });
        return res.status(200).json({
            message: 'Login successful', token, payload
        });
    }
    catch (error) {
        next(error);
    }
}
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
async function googleLogin(req, res, next) {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: "Missing Google access token" });
        }
        // 1. Verify Google token
        const ticket = await client.getTokenInfo(accessToken);
        const email = ticket.email;
        const googleId = ticket.sub;
        // 2. Check if user exists in your DB
        let user = await model_1.userModel.findOne({ email });
        const firstName = email?.split("@")[0] ?? "unknown";
        // 3. If not, create a new user automatically
        if (!user) {
            user = await model_1.userModel.create({
                firstName,
                email,
                googleId,
                roles: ["renter"], // or whatever default roles you use
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
            drivewayIds: user.drivewayIds
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
        console.error(error);
        next(error);
    }
}
async function completeStripeOnboarding(req, res) {
    const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
    try {
        const userId = req.query.userId;
        if (!userId)
            return res.status(400).json({ message: "Missing userId" });
        const user = await model_1.userModel.findById(userId);
        if (!user || !user.stripeAccountId) {
            return res.status(404).json({ message: "User or Stripe account not found" });
        }
        // Retrieve Stripe account status
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        // Check if onboarding is complete
        if (account.details_submitted && account.charges_enabled) {
            user.isStripeVerified = true;
            await user.save();
        }
        // Redirect back to your frontend
        return res.redirect("http://localhost:5174");
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error completing onboarding" });
    }
}
