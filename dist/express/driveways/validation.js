"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.drivewayUpdateSchemaZod = exports.drivewaySchemaZod = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
exports.drivewaySchemaZod = zod_1.z.object({
    ownerId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid ownerId",
    }),
    name: zod_1.z.string().min(1).max(100).trim(),
    address: zod_1.z.string().min(5).max(200).trim(),
    city: zod_1.z.string().min(1).max(100).trim(),
    state: zod_1.z.string().min(1).max(100).trim(),
    zipcode: zod_1.z.string().min(1).max(20).trim(),
    latitude: zod_1.z.preprocess((v) => Number(v), zod_1.z.number()),
    longitude: zod_1.z.preprocess((v) => Number(v), zod_1.z.number()),
    description: zod_1.z.string().min(1).max(1000).trim().optional(),
    walk: zod_1.z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
        message: "walk must be a numeric string",
    }),
    price: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().positive()),
    rules: zod_1.z.preprocess((v) => {
        try {
            return JSON.parse(v);
        }
        catch {
            return null;
        }
    }, zod_1.z.array(zod_1.z.string()).nonempty("rules must be an array of strings")),
}).passthrough();
exports.drivewayUpdateSchemaZod = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100).trim().optional(),
    address: zod_1.z.string().min(5).max(200).trim().optional(),
    city: zod_1.z.string().min(1).max(100).trim().optional(),
    state: zod_1.z.string().min(1).max(100).trim().optional(),
    zipcode: zod_1.z.string().min(1).max(20).trim().optional(),
    latitude: zod_1.z.preprocess((v) => Number(v), zod_1.z.number()).optional(),
    longitude: zod_1.z.preprocess((v) => Number(v), zod_1.z.number()).optional(),
    description: zod_1.z.string().max(1000).trim().optional(),
    walk: zod_1.z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, {
        message: "walk must be a numeric string",
    }).optional(),
    price: zod_1.z.preprocess((v) => Number(v), zod_1.z.number().positive()).optional(),
    rules: zod_1.z.preprocess((v) => {
        try {
            return JSON.parse(v);
        }
        catch {
            return null;
        }
    }, zod_1.z.array(zod_1.z.string())).optional(),
}).passthrough();
