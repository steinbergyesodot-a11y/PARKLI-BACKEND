import { createLogger,format,transports } from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const baseTransports: any[] = [new transports.Console()];

if (process.env.LOGGER_TAIL_TOKEN) {
    const logtail = new Logtail(process.env.LOGGER_TAIL_TOKEN);
    baseTransports.push(new LogtailTransport(logtail));
}

export const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: baseTransports
})