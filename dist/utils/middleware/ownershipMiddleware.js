"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUserOwnership = requireUserOwnership;
exports.requireDrivewayOwnership = requireDrivewayOwnership;
function requireUserOwnership(req, res, next) {
    const loggedInUserId = req.user._id;
    const targetUserId = req.params.userId;
    if (loggedInUserId !== targetUserId) {
        return res.status(403).json({
            error: "You cannot modify another user's data"
        });
    }
    next();
}
function requireDrivewayOwnership(req, res, next) {
    const targetDrivewayId = req.params.drivewayId;
    if (!req.user || !Array.isArray(req.user.drivewayIds)) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    const ownsDriveway = req.user.drivewayIds.includes(targetDrivewayId);
    if (!ownsDriveway) {
        return res.status(403).json({ message: "Unauthorized" });
    }
    next();
}
// A hacker can modify a url, so he can change the user id url to another user. But, he can't modify
// a jwt. Therefor, we check to make sure the userId of the url is the same userId that he got from 
// the jwt.
