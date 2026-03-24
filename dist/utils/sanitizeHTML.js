"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clean = clean;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
function clean(input) {
    return (0, sanitize_html_1.default)(input, {
        allowedTags: [],
        allowedAttributes: {}
    });
}
