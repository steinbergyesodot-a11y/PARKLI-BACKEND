"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDriveway = addDriveway;
exports.updateDriveway = updateDriveway;
exports.getDrivewayById = getDrivewayById;
exports.getAllDriveways = getAllDriveways;
exports.getGamesByDrivewayId = getGamesByDrivewayId;
exports.updateDrivewayById = updateDrivewayById;
exports.blockGame = blockGame;
exports.unblockGame = unblockGame;
exports.updateDrivewayCancleBooking = updateDrivewayCancleBooking;
exports.getAllDrivewaysByUserId = getAllDrivewaysByUserId;
exports.getAllRulesByDrivewayId = getAllRulesByDrivewayId;
const mongoose_1 = __importDefault(require("mongoose"));
const manager_1 = require("./manager");
const config_cloudinary_1 = __importDefault(require("../../utils/config.cloudinary"));
const model_1 = require("../users/model");
const stripe_1 = require("../stripe"); // your Stripe instance
const validation_1 = require("./validation");
const sanitizeHTML_1 = require("../../utils/sanitizeHTML");
const logger_1 = require("../../utils/logger/logger");
const responseWrapper_1 = require("../../utils/responseWrapper");
async function addDriveway(req, res, next) {
    var _a, _b, _c;
    logger_1.logger.info({
        message: "addDriveway called",
        ownerId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        ip: req.ip
    });
    try {
        const ownerId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!ownerId || !mongoose_1.default.Types.ObjectId.isValid(ownerId)) {
            logger_1.logger.warn({
                message: "Invalid ownerId format",
                ownerId,
                ip: req.ip
            });
            return next(new Error("Invalid ownerId format"));
        }
        const files = req.files || [];
        if (files.length === 0) {
            logger_1.logger.warn({
                message: "No images provided for driveway",
                ownerId,
                ip: req.ip
            });
            return next(new Error("At least one image is required"));
        }
        const imageUrls = [];
        for (const file of files) {
            try {
                const result = await config_cloudinary_1.default.uploader.upload(file.path);
                imageUrls.push(result.secure_url);
            }
            catch (err) {
                logger_1.logger.error({
                    message: "Image upload failed",
                    error: err.message,
                    stack: err.stack,
                    ownerId
                });
                return next(new Error("Image upload failed"));
            }
        }
        const data = validation_1.drivewaySchemaZod.parse(req.body);
        const drivewayData = {
            ownerId,
            name: (0, sanitizeHTML_1.clean)(data.name),
            address: (0, sanitizeHTML_1.clean)(data.address),
            city: (0, sanitizeHTML_1.clean)(data.city),
            state: (0, sanitizeHTML_1.clean)(data.state),
            zipcode: (0, sanitizeHTML_1.clean)(data.zipcode),
            latitude: data.latitude,
            longitude: data.longitude,
            walk: data.walk,
            price: data.price,
            rules: data.rules,
            description: data.description ? (0, sanitizeHTML_1.clean)(data.description) : "",
            images: imageUrls
        };
        logger_1.logger.info({
            message: "Creating new driveway",
            ownerId,
            address: drivewayData.address
        });
        const newDriveway = await manager_1.DrivewayManager.createDriveway(drivewayData);
        const user = await model_1.userModel.findByIdAndUpdate(ownerId, {
            $push: { drivewayIds: newDriveway._id },
            $addToSet: { roles: "host" }
        }, { new: true });
        if (!user) {
            logger_1.logger.warn({
                message: "User not found during driveway creation",
                ownerId
            });
            return next(new Error("User not found"));
        }
        if (!user.stripeAccountId) {
            logger_1.logger.info({
                message: "Creating Stripe account for host",
                ownerId,
                email: user.email
            });
            const account = await stripe_1.stripe.accounts.create({
                type: "express",
                email: user.email
            });
            user.stripeAccountId = account.id;
            user.isStripeVerified = false;
            await user.save();
        }
        const returnUrl = `https://parkli-front.vercel.app/Onboard-Complete`;
        const refreshUrl = `https://parkli-front.vercel.app/Onboard-Retry`;
        const onboardingLink = await stripe_1.stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding"
        });
        logger_1.logger.info({
            message: "Driveway created successfully",
            drivewayId: newDriveway._id,
            ownerId
        });
        return res.status(201).json((0, responseWrapper_1.responseWrapper)(true, {
            onboardingUrl: onboardingLink.url,
            drivewayId: newDriveway._id,
            address: newDriveway.address
        }, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in addDriveway",
            error: error.message,
            stack: error.stack,
            ownerId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
            ip: req.ip
        });
        next(error);
    }
}
async function updateDriveway(req, res, next) {
    var _a, _b, _c, _d, _e, _f, _g;
    logger_1.logger.info({
        message: "updateDriveway called",
        drivewayId: req.params.drivewayId,
        ownerId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        ip: req.ip
    });
    try {
        const drivewayId = req.params.drivewayId;
        const ownerId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        if (!ownerId || !mongoose_1.default.Types.ObjectId.isValid(ownerId)) {
            return next(new Error("Invalid ownerId format"));
        }
        if (!drivewayId || !mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
            return next(new Error("Invalid drivewayId format"));
        }
        // Fetch existing driveway and verify ownership
        const existingDriveway = await manager_1.DrivewayManager.findDrivewayById(drivewayId);
        if (!existingDriveway) {
            return next(new Error("Driveway not found"));
        }
        if (existingDriveway.ownerId.toString() !== ownerId) {
            return next(new Error("Unauthorized: You do not own this driveway"));
        }
        // Handle new image uploads
        const newFiles = req.files || [];
        const newImageUrls = [];
        for (const file of newFiles) {
            try {
                const result = await config_cloudinary_1.default.uploader.upload(file.path);
                newImageUrls.push(result.secure_url);
            }
            catch (err) {
                logger_1.logger.error({
                    message: "New image upload failed",
                    error: err.message,
                    drivewayId,
                    ownerId
                });
                return next(new Error("Image upload failed"));
            }
        }
        // Parse existing images
        let existingImages = [];
        if (req.body.existingImages) {
            try {
                const parsed = JSON.parse(req.body.existingImages);
                existingImages = parsed.map((img) => img.url || img);
            }
            catch {
                existingImages = [];
            }
        }
        // Combine images
        const allImageUrls = [...existingImages, ...newImageUrls];
        if (allImageUrls.length === 0) {
            return next(new Error("At least one image is required"));
        }
        // Delete removed images from Cloudinary
        const removedImages = existingDriveway.images.filter((img) => !existingImages.includes(img));
        for (const imageUrl of removedImages) {
            try {
                const publicId = (_c = imageUrl.split("/").pop()) === null || _c === void 0 ? void 0 : _c.split(".")[0];
                if (publicId) {
                    await config_cloudinary_1.default.uploader.destroy(publicId);
                }
            }
            catch (err) {
                logger_1.logger.warn({
                    message: "Failed to delete image from Cloudinary",
                    error: err.message,
                    drivewayId
                });
            }
        }
        // Parse rules
        let rules = [];
        if (req.body.rules) {
            try {
                rules = JSON.parse(req.body.rules);
            }
            catch {
                rules = [];
            }
        }
        // Prepare update data (skip validation - use what's provided)
        const updateData = {
            name: ((_d = req.body.name) === null || _d === void 0 ? void 0 : _d.trim()) || existingDriveway.name,
            address: ((_e = req.body.address) === null || _e === void 0 ? void 0 : _e.trim()) || existingDriveway.address,
            walk: req.body.walk || existingDriveway.walk,
            price: req.body.price || existingDriveway.price,
            description: ((_f = req.body.description) === null || _f === void 0 ? void 0 : _f.trim()) || existingDriveway.description,
            rules: rules.length > 0 ? rules : existingDriveway.rules,
            images: allImageUrls
        };
        logger_1.logger.info({
            message: "Updating driveway",
            drivewayId,
            ownerId
        });
        const updatedDriveway = await manager_1.DrivewayManager.updateDriveway(drivewayId, updateData);
        logger_1.logger.info({
            message: "Driveway updated successfully",
            drivewayId,
            ownerId
        });
        return res.status(200).json({
            message: "Driveway updated successfully",
            driveway: updatedDriveway
        });
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in updateDriveway",
            error: error.message,
            stack: error.stack,
            ownerId: (_g = req.user) === null || _g === void 0 ? void 0 : _g._id,
            ip: req.ip
        });
        next(error);
    }
}
async function getDrivewayById(req, res, next) {
    const drivewayId = req.params.drivewayId;
    logger_1.logger.info({
        message: "getDrivewayById called",
        drivewayId,
        ip: req.ip
    });
    if (!drivewayId) {
        logger_1.logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const driveway = await manager_1.DrivewayManager.findDrivewayById(drivewayId);
        if (!driveway) {
            logger_1.logger.warn({
                message: "Driveway not found",
                drivewayId,
                ip: req.ip
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Driveway fetched successfully",
            drivewayId
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, driveway, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getDrivewayById",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        next(error);
    }
}
async function getAllDriveways(req, res, next) {
    logger_1.logger.info({
        message: "getAllDriveways called",
        ip: req.ip
    });
    try {
        const driveways = await manager_1.DrivewayManager.getAllDriveways();
        if (!driveways || driveways.length === 0) {
            logger_1.logger.warn({
                message: "No driveways found",
                ip: req.ip
            });
            return next(new Error("No driveways found"));
        }
        logger_1.logger.info({
            message: "Driveways fetched successfully",
            count: driveways.length
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, driveways));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getAllDriveways",
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        next(error);
    }
}
async function getGamesByDrivewayId(req, res, next) {
    var _a;
    const drivewayId = req.params.drivewayId;
    logger_1.logger.info({
        message: "getGamesByOwnerId called",
        drivewayId,
        ip: req.ip
    });
    if (!drivewayId) {
        logger_1.logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid ownerId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid ownerId format"));
    }
    try {
        const games = await manager_1.DrivewayManager.getGamesByDrivewayId(drivewayId);
        logger_1.logger.info({
            message: "Games fetched successfully",
            drivewayId,
            count: (_a = games === null || games === void 0 ? void 0 : games.length) !== null && _a !== void 0 ? _a : 0
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, games, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getGamesByOwnerId",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        next(new Error("Error fetching games"));
    }
}
async function updateDrivewayById(req, res, next) {
    var _a;
    const gameDate = (_a = req.params.gameDate) === null || _a === void 0 ? void 0 : _a.trim();
    const drivewayId = req.params.drivewayId;
    logger_1.logger.info({
        message: "updateDrivewayById called",
        drivewayId,
        gameDate,
        ip: req.ip
    });
    if (!drivewayId || !gameDate) {
        logger_1.logger.warn({
            message: "Missing parameters for updateDrivewayById",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("You're missing parameters"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.updateDrivewayById(drivewayId, gameDate);
        if (!updatedDriveway) {
            logger_1.logger.warn({
                message: "Driveway not found during update",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Driveway updated successfully",
            drivewayId,
            gameDate
        });
        return res
            .status(201)
            .json((0, responseWrapper_1.responseWrapper)(true, updateDriveway, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in updateDrivewayById",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}
async function blockGame(req, res, next) {
    var _a;
    const drivewayId = req.params.drivewayId;
    const gameDate = (_a = req.params.gameDate) === null || _a === void 0 ? void 0 : _a.trim();
    logger_1.logger.info({
        message: "blockGame called",
        drivewayId,
        gameDate,
        ip: req.ip
    });
    if (!drivewayId || !gameDate) {
        logger_1.logger.warn({
            message: "Missing parameters for blockGame",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.blockGame(drivewayId, gameDate);
        if (!updatedDriveway) {
            logger_1.logger.warn({
                message: "Driveway not found during blockGame",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Game blocked successfully",
            drivewayId,
            gameDate
        });
        return res
            .status(201)
            .json((0, responseWrapper_1.responseWrapper)(true, updateDriveway));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in blockGame",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}
async function unblockGame(req, res, next) {
    var _a;
    const drivewayId = req.params.drivewayId;
    const gameDate = (_a = req.params.gameDate) === null || _a === void 0 ? void 0 : _a.trim();
    logger_1.logger.info({
        message: "unblockGame called",
        drivewayId,
        gameDate,
        ip: req.ip
    });
    if (!drivewayId || !gameDate) {
        logger_1.logger.warn({
            message: "Missing parameters for unblockGame",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.unblockGame(drivewayId, gameDate);
        if (!updatedDriveway) {
            logger_1.logger.warn({
                message: "Driveway not found during unblockGame",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Game unblocked successfully",
            drivewayId,
            gameDate
        });
        return res
            .status(201)
            .json((0, responseWrapper_1.responseWrapper)(true, updateDriveway));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in unblockGame",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}
async function updateDrivewayCancleBooking(req, res, next) {
    var _a;
    const gameDate = (_a = req.params.gameDate) === null || _a === void 0 ? void 0 : _a.trim();
    const drivewayId = req.params.drivewayId;
    logger_1.logger.info({
        message: "updateDrivewayCancleBooking called",
        drivewayId,
        gameDate,
        ip: req.ip
    });
    if (!drivewayId || !gameDate) {
        logger_1.logger.warn({
            message: "Missing parameters for updateDrivewayCancleBooking",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const updatedDriveway = await manager_1.DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate);
        if (!updatedDriveway) {
            logger_1.logger.warn({
                message: "Driveway not found during updateDrivewayCancleBooking",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Booking canceled successfully",
            drivewayId,
            gameDate
        });
        return res
            .status(201)
            .json((0, responseWrapper_1.responseWrapper)(true, updateDriveway));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in updateDrivewayCancleBooking",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}
async function getAllDrivewaysByUserId(req, res, next) {
    var _a;
    const userId = req.params.userId;
    logger_1.logger.info({
        message: "getAllDrivewaysByUserId called",
        userId,
        ip: req.ip
    });
    if (!userId) {
        logger_1.logger.warn({
            message: "Missing user ID",
            ip: req.ip
        });
        return next(new Error("Missing user ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        logger_1.logger.warn({
            message: "Invalid userId format",
            userId,
            ip: req.ip
        });
        return next(new Error("Invalid userId format"));
    }
    try {
        const driveways = await manager_1.DrivewayManager.getAlldrivewaysByUserId(userId);
        logger_1.logger.info({
            message: "Driveways fetched successfully",
            userId,
            count: (_a = driveways === null || driveways === void 0 ? void 0 : driveways.length) !== null && _a !== void 0 ? _a : 0
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, driveways, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getAllDrivewaysByUserId",
            error: error.message,
            stack: error.stack,
            userId,
            ip: req.ip
        });
        next(error);
    }
}
async function getAllRulesByDrivewayId(req, res, next) {
    const drivewayId = req.params.drivewayId;
    logger_1.logger.info({
        message: "getAllRulesByDrivewayId called",
        drivewayId,
        ip: req.ip
    });
    if (!drivewayId) {
        logger_1.logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(drivewayId)) {
        logger_1.logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }
    try {
        const rules = await manager_1.DrivewayManager.getAllRulesByDrivewayId(drivewayId);
        if (!rules) {
            logger_1.logger.warn({
                message: "Driveway not found when fetching rules",
                drivewayId
            });
            return next(new Error("Driveway not found"));
        }
        logger_1.logger.info({
            message: "Rules fetched successfully",
            drivewayId,
            count: rules.length
        });
        return res
            .status(200)
            .json((0, responseWrapper_1.responseWrapper)(true, rules, null));
    }
    catch (error) {
        logger_1.logger.error({
            message: "Error in getAllRulesByDrivewayId",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Error fetching driveway rules"));
    }
}
