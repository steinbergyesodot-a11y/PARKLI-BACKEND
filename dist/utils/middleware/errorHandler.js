"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorHandler(err, req, res, next) {
    res.status(400).json({
        success: false,
        error: err.message
    });
}
exports.default = errorHandler;
