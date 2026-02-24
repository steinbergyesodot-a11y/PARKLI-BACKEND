import dotenv from 'dotenv';

dotenv.config();


"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access token missing' });
    jsonwebtoken_1.default.verify(token, 'JD392JS093HDbshw29JSI38hsje02ij1QJS9', (err, decoded) => {
        if (err) {
            res.status(403).json({ message: 'Invalid token' });
            return;
        }
        req.user = decoded;
        next();
    });
}
