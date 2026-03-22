"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.drivewayModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GameSchema = new mongoose_1.Schema({
    visiting_team: { type: String, required: true },
    game_time: { type: String, required: true },
    parkingBegins: { type: String, required: true },
    date: { type: String, required: true },
    booked: { type: Boolean, required: false },
    blocked: { type: Boolean, required: true, default: false }
});
const drivewaySchema = new mongoose_1.default.Schema({
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
        default: "My Driveway"
    },
    walk: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String]
    },
    description: {
        type: String
    },
    publicDisplay: {
        type: String
    },
    rules: {
        type: [String]
    },
    isStripeVerified: {
        type: Boolean,
        default: false
    },
    games: {
        type: [GameSchema],
        default: []
    }
});
exports.drivewayModel = mongoose_1.default.model('driveway', drivewaySchema);
