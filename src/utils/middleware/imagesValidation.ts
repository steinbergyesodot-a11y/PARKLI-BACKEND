import { Request, Response, NextFunction } from "express";

export function ImagesValidation(req: Request, res: Response, next: NextFunction) {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
        return next(new Error("At least one image is required"));
    }

    if (files.length > 5) {
        return next(new Error("You can upload a maximum of 5 images"));
    }

    for (const file of files) {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return next(new Error(`Invalid file type: ${file.originalname}`));
        }

        const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
        if (!allowedExtensions.includes(ext)) {
            return next(new Error(`Invalid file extension: ${file.originalname}`));
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return next(new Error(`File too large: ${file.originalname}`));
        }
    }

    next();
}
