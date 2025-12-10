import { Router } from "express";
import { config } from "../config"
import drivewayRouter from "./driveways/routes";

export const appRouter = Router();

appRouter.use(config.driveways.baseRoute, drivewayRouter);


appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});