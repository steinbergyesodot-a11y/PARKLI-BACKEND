"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentIntentSchemaZod = exports.bookingSchemaZod = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
exports.bookingSchemaZod = zod_1.z.object({
    ownerId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid ownerId",
    }),
    drivewayId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid drivewayId",
    }),
    renterId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid renterId",
    }),
    address: zod_1.z.string().min(1).max(200).trim(),
    price: zod_1.z.number().positive(),
    gameDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "gameDate must be YYYY-MM-DD",
    }),
    parkingBegins: zod_1.z.string().regex(/^\d{1,2}:\d{2}$/, {
        message: "parkingBegins must be HH:mm",
    }),
    paymentIntentId: zod_1.z.string().min(1),
    visiting_team: zod_1.z.string().min(1).trim(),
}).strict();
exports.paymentIntentSchemaZod = zod_1.z.object({
    ownerId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid ownerId",
    }),
    drivewayId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid drivewayId",
    }),
    renterId: zod_1.z.string().refine((v) => mongoose_1.default.Types.ObjectId.isValid(v), {
        message: "Invalid renterId",
    }),
    address: zod_1.z.string().min(1).max(200).trim(),
    price: zod_1.z.number().positive(),
    gameDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "gameDate must be YYYY-MM-DD",
    }),
    // UPDATED FIELD
    parkingBegins: zod_1.z.preprocess((val) => {
        if (typeof val !== "string")
            return val;
        // Match "12:20 PM" or "7:05 AM"
        const ampm = val.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
        if (ampm) {
            let [_, hour, minute, period] = ampm;
            let h = Number(hour);
            if (period.toUpperCase() === "PM" && h !== 12)
                h += 12;
            if (period.toUpperCase() === "AM" && h === 12)
                h = 0;
            return `${String(h).padStart(2, "0")}:${minute}`;
        }
        // Otherwise return unchanged (for 24-hour format)
        return val;
    }, zod_1.z.string().regex(/^\d{2}:\d{2}$/, {
        message: "parkingBegins must be HH:mm (24-hour format)",
    })),
    visiting_team: zod_1.z.string().min(1).trim(),
}).strict();
