"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDriveway = addDriveway;
exports.getDrivewayById = getDrivewayById;
exports.getAllDriveways = getAllDriveways;
exports.getGamesByOwnerId = getGamesByOwnerId;
exports.updateDrivewayById = updateDrivewayById;
exports.blockGame = blockGame;
exports.unblockGame = unblockGame;
exports.updateDrivewayCancleBooking = updateDrivewayCancleBooking;
exports.getAllDrivewaysByUserId = getAllDrivewaysByUserId;
exports.deleteDriveway = deleteDriveway;
const mongoose_1 = __importDefault(require("mongoose"));
const manager_1 = require("./manager");
const config_cloudinary_1 = __importDefault(require("../../utils/config.cloudinary"));
const model_1 = require("../users/model");
const stripe_1 = require("../stripe"); // your Stripe instance
async function addDriveway(req, res) {
    try {
        const files = req.files;
        const imageUrls = [];
        // Upload images
        for (const file of files) {
            const result = await config_cloudinary_1.default.uploader.upload(file.path);
            imageUrls.push(result.secure_url);
        }
        const { ownerId, address, name, walk, price, description } = req.body;
        const rules = JSON.parse(req.body.rules);
        if (!ownerId || !name || !address || !walk || !price || !description) {
            return res.status(400).json({ message: "You're missing parameters" });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({ message: "invalid owner id" });
        }
        const drivewayData = {
            ownerId,
            address,
            name,
            walk,
            price,
            rules,
            description,
            images: imageUrls
        };
        // 1. Create driveway
        const newDriveway = await manager_1.DrivewayManager.createDriveway(drivewayData);
        // 2. Update user role to host
        const user = await model_1.userModel.findByIdAndUpdate(newDriveway.ownerId, {
            $push: { drivewayIds: newDriveway._id },
            $addToSet: { roles: "host" }
        }, { new: true });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // 3. If user does NOT have a Stripe account, create one
        if (!user.stripeAccountId) {
            const account = await stripe_1.stripe.accounts.create({
                type: "express",
                email: user.email
            });
            user.stripeAccountId = account.id;
            user.isStripeVerified = false;
            await user.save();
        }
        // 4. Generate onboarding link
        const onboardingLink = await stripe_1.stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: `http://localhost:4000/api/users/stripe/onboarding/refresh?userId=${user._id}`,
            return_url: `http://localhost:4000/api/users/stripe/onboarding/complete?userId=${user._id}`,
            type: "account_onboarding"
        });
        // 5. Return driveway + onboarding URL
        return res.status(201).json({
            message: "Created new driveway",
            newDriveway,
            onboardingUrl: onboardingLink.url
        });
    }
    catch (error) {
        console.error("REAL BACKEND ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}
async function getDrivewayById(req, res) {
    const drivewayId = req.params.drivewayId;
    if (!drivewayId) {
        return res.status(400).json({ Message: "missing driveway Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        res.status(400).json({ error: "Invalid drivewayId format" });
        return;
    }
    try {
        const driveway = await manager_1.DrivewayManager.findDrivewayById(drivewayId);
        if (driveway) {
            res.status(200).json({
                driveway
            });
        }
        else {
            return res.status(404).json({ message: "Driveway not found!" });
        }
    }
    catch (error) {
        res.status(500).json({
            error: "server error"
        });
    }
}
async function getAllDriveways(req, res) {
    try {
        const driveways = await manager_1.DrivewayManager.getAllDriveways();
        if (driveways.length === 0) {
            return res.status(404).json({ message: "No driveways found" });
        }
        res.status(200).json({ driveways });
    }
    catch (error) {
        res.status(500).json({
            error: "internal server error"
        });
    }
}
async function getGamesByOwnerId(req, res) {
    const ownerId = req.params.ownerId;
    if (!ownerId) {
        return res.status(400).json({ Message: "missing driveway Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(ownerId)) {
        res.status(400).json({ error: "Invalid drivewayId format" });
        return;
    }
    try {
        const games = await manager_1.DrivewayManager.getGamesByOwnerId(ownerId);
        res.status(200).json({
            message: "found games",
            games
        });
    }
    catch (error) {
        res.status(500).json({
            "error": error
        });
    }
}
async function updateDrivewayById(req, res) {
    const gameDate = req.params.gameDate.trim();
    const drivewayId = req.params.drivewayId;
    if (!drivewayId || !gameDate) {
        return res.status(400).json({ message: 'You`re missing parameters' });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        return res.status(400).json({ message: "invalid id" });
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.updateDrivewayById(drivewayId, gameDate);
        return res.status(201).json({
            updatedDriveway: updatedDriveway
        });
    }
    catch (error) {
        res.status(500).json({
            error: error
        });
    }
}
async function blockGame(req, res) {
    const drivewayId = req.params.drivewayId;
    const gameDate = req.params.gameDate.trim();
    if (!drivewayId || !gameDate) {
        return res.status(400).json({ message: "Missing parameters" });
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.blockGame(drivewayId, gameDate);
        return res.status(201).json({
            updatedDriveway
        });
    }
    catch (error) {
        return res.status(500).json({
            "error": error
        });
    }
}
async function unblockGame(req, res) {
    const gameDate = req.params.gameDate.trim();
    const drivewayId = req.params.drivewayId;
    if (!drivewayId || !gameDate) {
        return res.status(400).json({ message: "Missing parameters" });
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.unblockGame(drivewayId, gameDate);
        return res.status(200).json({ "updatedDriveway": updatedDriveway });
    }
    catch (error) {
        res.status(500).json({ error });
    }
}
async function updateDrivewayCancleBooking(req, res) {
    const gameDate = req.params.gameDate.trim();
    const drivewayId = req.params.drivewayId;
    if (!drivewayId || !gameDate) {
        return res.status(400).json({ message: 'You`re missing parameters' });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        return res.status(400).json({ message: "invalid id" });
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate);
        return res.json({ message: "cancled booking", driveway: updatedDriveway });
    }
    catch (error) {
        console.error("Error updating game availability:", error.message);
        return res.status(400).json({ message: error.message });
    }
}
async function getAllDrivewaysByUserId(req, res) {
    const userId = req.params.userId;
    if (!userId) {
        return res.status(400).json({ Message: "missing driveway Id." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid drivewayId format" });
        return;
    }
    try {
        const driveways = await manager_1.DrivewayManager.getAlldrivewaysByUserId(userId);
        return res.status(200).json({
            driveways
        });
    }
    catch (error) {
        return res.status(500).json({ error });
    }
}
function deleteDriveway(req, res) {
}
