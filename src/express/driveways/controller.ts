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
import { drivewaySchemaZod, drivewayUpdateSchemaZod } from "./validation";
import { clean } from "../../utils/sanitizeHTML";
import { logger } from "../../utils/logger/logger"; 



export async function addDriveway(req: Request, res: Response, next: NextFunction) {

  logger.info({
    message: "addDriveway called",
    ownerId: req.user?._id,
    ip: req.ip
  });

  try {
    const ownerId = req.user?._id;
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      logger.warn({
        message: "Invalid ownerId format",
        ownerId,
        ip: req.ip
      });
      return next(new Error("Invalid ownerId format"));
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      logger.warn({
        message: "No images provided for driveway",
        ownerId,
        ip: req.ip
      });
      return next(new Error("At least one image is required"));
    }

    const imageUrls: string[] = [];
    for (const file of files) {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        imageUrls.push(result.secure_url);
      } catch (err: any) {
        logger.error({
          message: "Image upload failed",
          error: err.message,
          stack: err.stack,
          ownerId
        });
        return next(new Error("Image upload failed"));
      }
    }

    const data = drivewaySchemaZod.parse(req.body);

const drivewayData: IDriveway = {
  ownerId,
  name: clean(data.name),
  address: clean(data.address),
  city: clean(data.city),
  state: clean(data.state),
  zipcode: clean(data.zipcode),
  latitude: data.latitude,
  longitude: data.longitude,
  walk: data.walk,
  price: data.price,
  rules: data.rules,
  description: clean(data.description),
  images: imageUrls
};

    logger.info({
      message: "Creating new driveway",
      ownerId,
      address: drivewayData.address
    });

    const newDriveway = await DrivewayManager.createDriveway(drivewayData);

    const user = await userModel.findByIdAndUpdate(
      ownerId,
      {
        $push: { drivewayIds: newDriveway._id },
        $addToSet: { roles: "host" }
      },
      { new: true }
    );

    if (!user) {
      logger.warn({
        message: "User not found during driveway creation",
        ownerId
      });
      return next(new Error("User not found"));
    }

    if (!user.stripeAccountId) {
      logger.info({
        message: "Creating Stripe account for host",
        ownerId,
        email: user.email
      });

      const account = await stripe.accounts.create({
        type: "express",
        email: user.email
      });

      user.stripeAccountId = account.id;
      user.isStripeVerified = false;
      await user.save();
    }

    const returnUrl = `https://parkli-front.vercel.app/Onboard-Complete`;
    const refreshUrl = `https://parkli-front.vercel.app/Onboard-Retry`;

    const onboardingLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding"
    });

    logger.info({
      message: "Driveway created successfully",
      drivewayId: newDriveway._id,
      ownerId
    });

    return res.status(201).json({
      onboardingUrl: onboardingLink.url
    });

  } catch (error: any) {
    logger.error({
      message: "Error in addDriveway",
      error: error.message,
      stack: error.stack,
      ownerId: req.user?._id,
      ip: req.ip
    });
    next(error);
  }
}

export async function updateDriveway(req: Request, res: Response, next: NextFunction) {
  logger.info({
    message: "updateDriveway called",
    drivewayId: req.params.drivewayId,
    ownerId: req.user?._id,
    ip: req.ip
  });

  try {
    const drivewayId = req.params.drivewayId as string;
    const ownerId = req.user?._id;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return next(new Error("Invalid ownerId format"));
    }

    if (!drivewayId || !mongoose.Types.ObjectId.isValid(drivewayId)) {
      return next(new Error("Invalid drivewayId format"));
    }

    // Fetch existing driveway and verify ownership
    const existingDriveway = await DrivewayManager.findDrivewayById(drivewayId);
    if (!existingDriveway) {
      return next(new Error("Driveway not found"));
    }

    if (existingDriveway.ownerId.toString() !== ownerId) {
      return next(new Error("Unauthorized: You do not own this driveway"));
    }

    // Handle new image uploads
    const newFiles = (req.files as Express.Multer.File[]) || [];
    const newImageUrls: string[] = [];

    for (const file of newFiles) {
      try {
        const result = await cloudinary.uploader.upload(file.path);
        newImageUrls.push(result.secure_url);
      } catch (err: any) {
        logger.error({
          message: "New image upload failed",
          error: err.message,
          drivewayId,
          ownerId
        });
        return next(new Error("Image upload failed"));
      }
    }

    // Parse existing images
    let existingImages: string[] = [];
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        existingImages = parsed.map((img: any) => img.url || img);
      } catch {
        existingImages = [];
      }
    }

    // Combine images
    const allImageUrls = [...existingImages, ...newImageUrls];

    if (allImageUrls.length === 0) {
      return next(new Error("At least one image is required"));
    }

    // Delete removed images from Cloudinary
    const removedImages = existingDriveway.images.filter(
      (img: string) => !existingImages.includes(img)
    );

    for (const imageUrl of removedImages) {
      try {
        const publicId = imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err: any) {
        logger.warn({
          message: "Failed to delete image from Cloudinary",
          error: err.message,
          drivewayId
        });
      }
    }

    // Parse rules
    let rules: string[] = [];
    if (req.body.rules) {
      try {
        rules = JSON.parse(req.body.rules);
      } catch {
        rules = [];
      }
    }

    // Prepare update data (skip validation - use what's provided)
    const updateData: Partial<IDriveway> = {
      name: req.body.name?.trim() || existingDriveway.name,
      address: req.body.address?.trim() || existingDriveway.address,
      walk: req.body.walk || existingDriveway.walk,
      price: req.body.price || existingDriveway.price,
      description: req.body.description?.trim() || existingDriveway.description,
      rules: rules.length > 0 ? rules : existingDriveway.rules,
      images: allImageUrls
    };

    logger.info({
      message: "Updating driveway",
      drivewayId,
      ownerId
    });

    const updatedDriveway = await DrivewayManager.updateDriveway(
      drivewayId,
      updateData
    );

    logger.info({
      message: "Driveway updated successfully",
      drivewayId,
      ownerId
    });

    return res.status(200).json({
      message: "Driveway updated successfully",
      driveway: updatedDriveway
    });

  } catch (error: any) {
    logger.error({
      message: "Error in updateDriveway",
      error: error.message,
      stack: error.stack,
      ownerId: req.user?._id,
      ip: req.ip
    });
    next(error);
  }
}

export async function getDrivewayById(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;

    logger.info({
        message: "getDrivewayById called",
        drivewayId,
        ip: req.ip
    });

    if (!drivewayId) {
        logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const driveway = await DrivewayManager.findDrivewayById(drivewayId);

        if (!driveway) {
            logger.warn({
                message: "Driveway not found",
                drivewayId,
                ip: req.ip
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Driveway fetched successfully",
            drivewayId
        });

        return res.status(200).json({ driveway });

    } catch (error: any) {
        logger.error({
            message: "Error in getDrivewayById",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        next(error);
    }
}


export async function getAllDriveways(req: Request, res: Response, next: NextFunction) {
    logger.info({
        message: "getAllDriveways called",
        ip: req.ip
    });

    try {
        const driveways = await DrivewayManager.getAllDriveways();

        if (!driveways || driveways.length === 0) {
            logger.warn({
                message: "No driveways found",
                ip: req.ip
            });
            return next(new Error("No driveways found"));
        }

        logger.info({
            message: "Driveways fetched successfully",
            count: driveways.length
        });

        return res.status(200).json({ driveways });

    } catch (error: any) {
        logger.error({
            message: "Error in getAllDriveways",
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        next(error);
    }
}


export async function getGamesByOwnerId(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;

    logger.info({
        message: "getGamesByOwnerId called",
        drivewayId,
        ip: req.ip
    });

    if (!drivewayId) {
        logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid ownerId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid ownerId format"));
    }

    try {
        const games = await DrivewayManager.getGamesByDrivewayId(drivewayId);

        logger.info({
            message: "Games fetched successfully",
            drivewayId,
            count: games?.length ?? 0
        });

        return res.status(200).json({
            message: "Found games",
            games
        });

    } catch (error: any) {
        logger.error({
            message: "Error in getGamesByOwnerId",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        next(error);
    }
}



export async function updateDrivewayById(req: Request, res: Response, next: NextFunction) {
    const gameDate = (req.params.gameDate as string)?.trim();
    const drivewayId = req.params.drivewayId as string;

    logger.info({
        message: "updateDrivewayById called",
        drivewayId,
        gameDate,
        ip: req.ip
    });

    if (!drivewayId || !gameDate) {
        logger.warn({
            message: "Missing parameters for updateDrivewayById",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("You're missing parameters"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.updateDrivewayById(drivewayId, gameDate);

        if (!updatedDriveway) {
            logger.warn({
                message: "Driveway not found during update",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Driveway updated successfully",
            drivewayId,
            gameDate
        });

        return res.status(200).json({
            updatedDriveway
        });

    } catch (error: any) {
        logger.error({
            message: "Error in updateDrivewayById",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}


export async function blockGame(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    const gameDate = (req.params.gameDate as string)?.trim();

    logger.info({
        message: "blockGame called",
        drivewayId,
        gameDate,
        ip: req.ip
    });

    if (!drivewayId || !gameDate) {
        logger.warn({
            message: "Missing parameters for blockGame",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.blockGame(drivewayId, gameDate);

        if (!updatedDriveway) {
            logger.warn({
                message: "Driveway not found during blockGame",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Game blocked successfully",
            drivewayId,
            gameDate
        });

        return res.status(200).json({ updatedDriveway });

    } catch (error: any) {
        logger.error({
            message: "Error in blockGame",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}


export async function unblockGame(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;
    const gameDate = (req.params.gameDate as string)?.trim();

    logger.info({
        message: "unblockGame called",
        drivewayId,
        gameDate,
        ip: req.ip
    });

    if (!drivewayId || !gameDate) {
        logger.warn({
            message: "Missing parameters for unblockGame",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.unblockGame(drivewayId, gameDate);

        if (!updatedDriveway) {
            logger.warn({
                message: "Driveway not found during unblockGame",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Game unblocked successfully",
            drivewayId,
            gameDate
        });

        return res.status(200).json({ updatedDriveway });

    } catch (error: any) {
        logger.error({
            message: "Error in unblockGame",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}


export async function updateDrivewayCancleBooking(req: Request, res: Response, next: NextFunction) {
    const gameDate = (req.params.gameDate as string)?.trim();
    const drivewayId = req.params.drivewayId as string;

    logger.info({
        message: "updateDrivewayCancleBooking called",
        drivewayId,
        gameDate,
        ip: req.ip
    });

    if (!drivewayId || !gameDate) {
        logger.warn({
            message: "Missing parameters for updateDrivewayCancleBooking",
            drivewayId,
            gameDate,
            ip: req.ip
        });
        return next(new Error("Missing parameters"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const updatedDriveway = await DrivewayManager.updateDrivewayCancelBooking(drivewayId, gameDate);

        if (!updatedDriveway) {
            logger.warn({
                message: "Driveway not found during updateDrivewayCancleBooking",
                drivewayId,
                gameDate
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Booking canceled successfully",
            drivewayId,
            gameDate
        });

        return res.status(200).json({
            message: "Canceled booking",
            driveway: updatedDriveway
        });

    } catch (error: any) {
        logger.error({
            message: "Error in updateDrivewayCancleBooking",
            error: error.message,
            stack: error.stack,
            drivewayId,
            gameDate,
            ip: req.ip
        });
        next(error);
    }
}



export async function getAllDrivewaysByUserId(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;

    logger.info({
        message: "getAllDrivewaysByUserId called",
        userId,
        ip: req.ip
    });

    if (!userId) {
        logger.warn({
            message: "Missing user ID",
            ip: req.ip
        });
        return next(new Error("Missing user ID"));
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn({
            message: "Invalid userId format",
            userId,
            ip: req.ip
        });
        return next(new Error("Invalid userId format"));
    }

    try {
        const driveways = await DrivewayManager.getAlldrivewaysByUserId(userId);

        logger.info({
            message: "Driveways fetched successfully",
            userId,
            count: driveways?.length ?? 0
        });

        return res.status(200).json({ driveways });

    } catch (error: any) {
        logger.error({
            message: "Error in getAllDrivewaysByUserId",
            error: error.message,
            stack: error.stack,
            userId,
            ip: req.ip
        });
        next(error);
    }
}


export async function getAllRulesByDrivewayId(req: Request, res: Response, next: NextFunction) {
    const drivewayId = req.params.drivewayId as string;

    logger.info({
        message: "getAllRulesByDrivewayId called",
        drivewayId,
        ip: req.ip
    });

    if (!drivewayId) {
        logger.warn({
            message: "Missing driveway ID",
            ip: req.ip
        });
        return next(new Error("Missing driveway ID"));
    }

    if (!mongoose.Types.ObjectId.isValid(drivewayId)) {
        logger.warn({
            message: "Invalid drivewayId format",
            drivewayId,
            ip: req.ip
        });
        return next(new Error("Invalid drivewayId format"));
    }

    try {
        const rules = await DrivewayManager.getAllRulesByDrivewayId(drivewayId);

        if (!rules) {
            logger.warn({
                message: "Driveway not found when fetching rules",
                drivewayId
            });
            return next(new Error("Driveway not found"));
        }

        logger.info({
            message: "Rules fetched successfully",
            drivewayId,
            count: rules.length
        });

        return res.status(200).json({ rules });

    } catch (error: any) {
        logger.error({
            message: "Error in getAllRulesByDrivewayId",
            error: error.message,
            stack: error.stack,
            drivewayId,
            ip: req.ip
        });
        next(error);
    }
}
