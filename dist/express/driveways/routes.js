"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticateToken_1 = require("../../utils/middleware/authenticateToken");
const ownershipMiddleware_1 = require("../../utils/middleware/ownershipMiddleware");
const controller_1 = require("./controller");
const multerUpload_1 = require("../../utils/middleware/multerUpload");
const imagesValidation_1 = require("../../utils/middleware/imagesValidation");
const drivewayRouter = express_1.default.Router();
drivewayRouter.post('/', authenticateToken_1.authenticateToken, multerUpload_1.upload.array('images', 5), // Multer FIRST
imagesValidation_1.ImagesValidation, // Validation AFTER Multer
controller_1.addDriveway);
drivewayRouter.get('/', controller_1.getAllDriveways);
drivewayRouter.get('/:drivewayId', controller_1.getDrivewayById);
drivewayRouter.get('/getGames/:ownerId', authenticateToken_1.authenticateToken, controller_1.getGamesByOwnerId);
drivewayRouter.get('/rules/:drivewayId', authenticateToken_1.authenticateToken, controller_1.getAllRulesByDrivewayId);
drivewayRouter.get('/getAllDrivewaysByUserId/:userId', authenticateToken_1.authenticateToken, ownershipMiddleware_1.requireUserOwnership, controller_1.getAllDrivewaysByUserId);
drivewayRouter.put('/:drivewayId/:gameDate', authenticateToken_1.authenticateToken, controller_1.updateDrivewayById);
drivewayRouter.put('/editDriveway/:drivewayId', authenticateToken_1.authenticateToken, controller_1.updateDriveway);
drivewayRouter.put('/:drivewayId/block/:gameDate', authenticateToken_1.authenticateToken, ownershipMiddleware_1.requireDrivewayOwnership, controller_1.blockGame);
drivewayRouter.put('/:drivewayId/unblock/:gameDate', authenticateToken_1.authenticateToken, ownershipMiddleware_1.requireDrivewayOwnership, controller_1.unblockGame);
drivewayRouter.put('/updateDrivewayCancleBooking/:drivewayId/:gameDate', authenticateToken_1.authenticateToken, ownershipMiddleware_1.requireDrivewayOwnership, controller_1.updateDrivewayCancleBooking);
exports.default = drivewayRouter;
