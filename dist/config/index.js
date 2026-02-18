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
exports.config = void 0;
const env = __importStar(require("env-var"));
require("./dotenv");
exports.config = {
    service: {
        port: env.get('PORT').default(6000).asPortNumber(),
        systemUnavailableURL: env.get('SYSTEM_UNAVAILABLE_URL').default('/unavailable').required().asString(),
        defaultLimit: env.get('DEFAULT_LIMIT').asIntPositive(),
        requestTimeout: env.get('REQUEST_TIMEOUT').default(10000).asIntPositive(),
    },
    // mongo: {
    //     uri: env.get('MONGO_URI').required().asString(),
    //     userCollectionName: env.get('USERS_COLLECTION_NAME').default('users').asString(),
    // },
    users: {
        baseRoute: env.get('USERS_BASE_ROUTE').default('/api/users').asString(),
    },
    driveways: {
        baseRoute: '/api/driveways'
    },
    bookings: {
        baseRoute: '/api/bookings'
    }
};
