"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const node_1 = require("@logtail/node");
const winston_2 = require("@logtail/winston");
const baseTransports = [new winston_1.transports.Console()];
if (process.env.LOGGER_TAIL_TOKEN) {
    const logtail = new node_1.Logtail(process.env.LOGGER_TAIL_TOKEN);
    baseTransports.push(new winston_2.LogtailTransport(logtail));
}
exports.logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: baseTransports
});
