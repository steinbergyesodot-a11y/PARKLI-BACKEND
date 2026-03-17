"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrivewayManager = void 0;
const model_1 = require("./model");
const mlbAPI_1 = require("../../utils/mlbAPI");
class DrivewayManager {
    static async createDriveway(driveway) {
        const games = await (0, mlbAPI_1.getCubsHomeGames)();
        return await model_1.drivewayModel.create({
            ...driveway,
            games: games
        });
    }
    static async updateDriveway(drivewayId, driveway) {
        const games = await (0, mlbAPI_1.getCubsHomeGames)();
        return await model_1.drivewayModel.findByIdAndUpdate(drivewayId, {
            ...driveway,
            games: games
        }, { new: true });
    }
    static async findDrivewayById(drivewayId) {
        return await model_1.drivewayModel.findById(drivewayId);
    }
    static async getAllDriveways() {
        const driveways = await model_1.drivewayModel.find({ isStripeVerified: true });
        return driveways;
    }
    static async getGamesByDrivewayId(drivewayId) {
        const driveway = await model_1.drivewayModel.findById(drivewayId);
        return (driveway === null || driveway === void 0 ? void 0 : driveway.games) || [];
    }
    static async updateDrivewayById(drivewayId, gameDate) {
        const normalized = gameDate.trim();
        const driveway = await model_1.drivewayModel.findById(drivewayId);
        if (!driveway)
            return null;
        if (driveway.games) {
            const game = driveway.games.find(g => g.date === normalized);
            if (!game)
                return null;
            game.booked = true;
            await driveway.save();
            return driveway;
        }
    }
    static async unblockGame(drivewayId, gameDate) {
        const normalized = gameDate.trim();
        return await model_1.drivewayModel.findOneAndUpdate({ _id: drivewayId }, {
            $set: {
                "games.$[game].blocked": false
            }
        }, {
            arrayFilters: [{ "game.date": normalized }],
            new: true
        });
    }
    static async blockGame(drivewayId, gameDate) {
        const normalized = gameDate.trim();
        return await model_1.drivewayModel.findOneAndUpdate({ _id: drivewayId }, {
            $set: {
                "games.$[game].blocked": true
            }
        }, {
            arrayFilters: [{ "game.date": normalized }],
            new: true
        });
    }
    static async updateDrivewayCancelBooking(drivewayId, gameDate) {
        const driveway = await model_1.drivewayModel.findById(drivewayId);
        if (!driveway) {
            throw new Error("Driveway not found");
        }
        if (!driveway.games || driveway.games.length === 0) {
            throw new Error("No games found for this driveway");
        }
        const game = driveway.games.find(g => g.date === gameDate);
        if (!game) {
            throw new Error("Game not found for this driveway");
        }
        game.booked = false;
        await driveway.save();
        return driveway;
    }
    static async getAlldrivewaysByUserId(userId) {
        return await model_1.drivewayModel.find({ ownerId: userId }).lean();
    }
    static async getAllRulesByDrivewayId(drivewayId) {
        const driveway = await model_1.drivewayModel.findById(drivewayId);
        if (!driveway)
            return null;
        return driveway.rules;
    }
}
exports.DrivewayManager = DrivewayManager;
