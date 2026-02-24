import mongoose from "mongoose";
import { DrivewayManager } from "./manager";
import { NextFunction, Request, Response } from "express";
import { drivewayModel } from "./model";
import { authenticateToken } from "../../utils/middleware/authenticateToken";
import cloudinary from "../../utils/config.cloudinary";
import { IDriveway,IGame } from "./interfce";
import { userModel } from "../users/model";
import drivewayRouter from "./routes";
import { stripe } from "../stripe"; // your Stripe instance


export async function addDriveway(req: Request, res: Response, next: NextFunction) {
    try {
        const files = req.files as Express.Multer.File[];
        const imageUrls: string[] = [];
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path);
            imageUrls.push(result.secure_url);
        }

        const { ownerId, address, name, walk, price, description } = req.body;
        let rules;
        try {
            rules = JSON.parse(req.body.rules);
        } catch {
            return next(new Error("Invalid rules format"));
        }

        if (!ownerId || !name || !address || !walk || !price || !description) {
            return next(new Error("You're missing parameters"));
        }

        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return next(new Error("Invalid ownerId format"));
        }
        const drivewayData: IDriveway = {
            ownerId,
            address,
            name,
            walk,
            price,
            rules,
            description,
            images: imageUrls
        };
        const newDriveway = await DrivewayManager.createDriveway(drivewayData);
        const user = await userModel.findByIdAndUpdate(
            newDriveway.ownerId,
            {
                $push: { drivewayIds: newDriveway._id },
                $addToSet: { roles: "host" }
            },
            { new: true }
        );

        if (!user) {
            return next(new Error("User not found"));
        }
        if (!user.stripeAccountId) {
            const account = await stripe.accounts.create({
                type: "express",
                email: user.email
            });

            user.stripeAccountId = account.id;
            user.isStripeVerified = false;
            await user.save();
        }
        const base = process.env.BACKEND_URL?.trim();
        if (!base) {
            throw new Error("BACKEND_URL is not set");
        }

        const userId = user._id.toString();

        const returnUrl = `http://localhost:5173/Onboard-Complete`;
        const refreshUrl = `http://localhost:517/Onboard-Retry`;

        const onboardingLink = await stripe.accountLinks.create({
            account: user.stripeAccountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: "account_onboarding"
        });
        return res.status(201).json({
            onboardingUrl: onboardingLink.url
        });

    } catch (error) {
        next(error); 
    }
}




export async function getDrivewayById(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    if (!drivewayId) {
        return next(new Error("Missing driveway ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const driveway = await DrivewayManager.findDrivewayById(drivewayId);

        if (!driveway) {
            return next(new Error("Driveway not found"));
        }

        return res.status(200).json({ driveway });

    } catch (error) {
        next(error);
    }
}

export async function getAllDriveways(req: Request, res: Response, next: NextFunction) {
    try {
        const driveways = await DrivewayManager.getAllDriveways();

        if (!driveways || driveways.length === 0) {
            return next(new Error("No driveways found"));
        }

        return res.status(200).json({ driveways });

    } catch (error) {
        next(error); 
    }
}

export async function getGamesByOwnerId(req: Request, res: Response, next: NextFunction) {
    const ownerId = req.params.ownerId as string;
    if (!ownerId) {
        return next(new Error("Missing owner ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
        return next(new Error("Invalid ownerId format"));
    }

    try {
        const games = await DrivewayManager.getGamesByOwnerId(ownerId);
        return res.status(200).json({
            message: "Found games",
            games
        });

    } catch (error) {
        next(error); 
    }
}

export async function updateDrivewayById(req: Request, res: Response, next: NextFunction) {
    const gameDate = (req.params.gameDate as string)?.trim();
    const drivewayId = req.params.drivewayId as string;

    if (!drivewayId || !gameDate) {
        return next(new Error("You're missing parameters"));
    }
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.updateDrivewayById(drivewayId, gameDate);

        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }
        return res.status(200).json({
            updatedDriveway
        });

    } catch (error) {
        next(error); 
    }
}


export async function blockGame(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    const gameDate = (req.params.gameDate as string)?.trim();

    // 1. Validate params
    if (!drivewayId || !gameDate) {
        return next(new Error("Missing parameters"));
    }

    // 2. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        // 3. Block game
        const updatedDriveway = await DrivewayManager.blockGame(drivewayId, gameDate);

        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }

        return res.status(200).json({ updatedDriveway });

    } catch (error) {
        next(error);
    }
}



export async function unblockGame(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    const gameDate = (req.params.gameDate as string)?.trim();
    if (!drivewayId || !gameDate) {
        return next(new Error("Missing parameters"));
    }
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.unblockGame(drivewayId, gameDate);

        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }

        return res.status(200).json({ updatedDriveway });

    } catch (error) {
        next(error);
    }
}


export async function updateDrivewayCancleBooking(req: Request, res: Response, next: NextFunction) {
    const gameDate = (req.params.gameDate as string)?.trim();
    const drivewayId = req.params.drivewayId as string;

    if (!drivewayId || !gameDate) {
        return next(new Error("Missing parameters"));
    }
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate);

        if (!updatedDriveway) {
            return next(new Error("Driveway not found"));
        }

        return res.status(200).json({
            message: "Canceled booking",
            driveway: updatedDriveway
        });

    } catch (error: any) {
        next(error);
    }
}



export async function getAllDrivewaysByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;
    if (!userId) {
        return next(new Error("Missing user ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid userId format"));
    }

    try {
        const driveways = await DrivewayManager.getAlldrivewaysByUserId(userId);

        return res.status(200).json({ driveways });

    } catch (error) {
        next(error);
    }
}



export async function getAllRulesByDrivewayId(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    if (!drivewayId) {
        return next(new Error("Missing driveway ID"));
    }
    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const rules = await DrivewayManager.getAllRulesByDrivewayId(drivewayId);
        if (!rules) {
            return next(new Error("Driveway not found"));
        }
        return res.status(200).json({ rules });

    } catch (error) {
        next(error);
    }
}




export function deleteDriveway(req:Request, res:Response){
}

