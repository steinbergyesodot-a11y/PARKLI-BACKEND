"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchemaZod = exports.userSchemaZod = void 0;
const zod_1 = require("zod");
exports.userSchemaZod = zod_1.z.object({
    firstName: zod_1.z.string().min(1, "First name is required").max(50).trim(),
    lastName: zod_1.z.string().min(1, "Last name is required").max(50).trim(),
    email: zod_1.z.string().email().max(100).trim().toLowerCase(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
}).strict();
exports.loginSchemaZod = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email format").trim().toLowerCase(),
    password: zod_1.z.string().min(1, "Password is required"),
}).strict();
