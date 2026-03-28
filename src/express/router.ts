import { Router } from "express";
import { config } from "../config"
import drivewayRouter from "./driveways/routes";
import usersRouter from "./users/routes";
import bookingRouter from "./bookings/routes";

export const appRouter = Router();

appRouter.use(config.driveways.baseRoute, drivewayRouter);

appRouter.use(config.users.baseRoute, usersRouter)

appRouter.use(config.bookings.baseRoute, bookingRouter);


appRouter.use(['/isAlive', '/isalive', '/health'], (_req, res) => {
    res.status(200).send('alive');
});
