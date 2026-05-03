import { Request,Response,NextFunction } from "express";

export function authorize(req:Request, res:Response, next:NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.roles !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
    }

    next();
}
