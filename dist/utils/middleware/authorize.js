"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
function authorize(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.user.roles !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
    }
    next();
}
