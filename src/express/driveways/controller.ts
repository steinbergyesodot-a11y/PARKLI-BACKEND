import mongoose from "mongoose";
import { DrivewayManager } from "./manager";
import { Request, Response } from "express";
import { drivewayModel } from "./model";
import { authenticateToken } from "../../utils/middleware/authenticateToken";
import cloudinary from "../../utils/config.cloudinary";
import { IDriveway,IGame } from "./interfce";
import { userModel } from "../users/model";
import drivewayRouter from "./routes";
import { stripe } from "../stripe"; // your Stripe instance


export async function addDriveway(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];

    // Upload images
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path);
      imageUrls.push(result.secure_url);
    }

    const { ownerId, address, name, walk, price, description } = req.body;
    const rules = JSON.parse(req.body.rules);

    if (!ownerId || !name || !address || !walk || !price || !description) {
      return res.status(400).json({ message: "You're missing parameters" });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "invalid owner id" });
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

    // 1. Create driveway
    const newDriveway = await DrivewayManager.createDriveway(drivewayData);

    // 2. Update user role to host
    const user = await userModel.findByIdAndUpdate(
      newDriveway.ownerId,
      {
        $push: { drivewayIds: newDriveway._id },
        $addToSet: { roles: "host" }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. If user does NOT have a Stripe account, create one
    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email
      });

      user.stripeAccountId = account.id;
      user.isStripeVerified = false
      await user.save();
    }

    // 4. Generate onboarding link
 const onboardingLink = await stripe.accountLinks.create({
  account: user.stripeAccountId,
  refresh_url: `${process.env.BACKEND_URL}/api/users/stripe/onboarding/refresh?userId=${user._id}`,
  return_url: `${process.env.BACKEND_URL}/api/users/stripe/onboarding/complete?userId=${user._id}`,
  type: "account_onboarding"
});


    // 5. Return driveway + onboarding URL
    return res.status(201).json({
      message: "Created new driveway",
      newDriveway,
      onboardingUrl: onboardingLink.url
    });

  } catch (error: any) {
    console.error("REAL BACKEND ERROR:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message || error
    });
  }
}



export async function getDrivewayById(req:Request, res:Response){
    
      const drivewayId = req.params.drivewayId
        if(!drivewayId){
           return res.status(400).json({Message : "missing driveway Id."})
        }
        if(!mongoose.Types.ObjectId.isValid(drivewayId)) {
            res.status(400).json({ error: "Invalid drivewayId format" });
            return
        }
        try{
            const driveway = await DrivewayManager.findDrivewayById(drivewayId)
                if(driveway){
                    res.status(200).json({
                        driveway
                    })
                }
                else{
                    return res.status(404).json({ message: "Driveway not found!"});
                }
            }catch(error){
                res.status(500).json({
                    error : "server error"
                })
        }
}




export async function getAllDriveways(req:Request,res:Response){
     try{
        const driveways = await DrivewayManager.getAllDriveways()
        if (driveways.length === 0) {
              return res.status(404).json({ message: "No driveways found" });
        }
        res.status(200).json({driveways})
     }catch(error){
        res.status(500).json({
            error : "internal server error"
        })
     }
}




export async function getGamesByOwnerId(req:Request, res:Response){
   const ownerId = req.params.ownerId
        if(!ownerId){
           return res.status(400).json({Message : "missing driveway Id."})
        }
        if(!mongoose.Types.ObjectId.isValid(ownerId)) {
            res.status(400).json({ error: "Invalid drivewayId format" });
            return
        }
        try{
          const games = await DrivewayManager.getGamesByOwnerId(ownerId);
          res.status(200).json({
            message: "found games",
            games
          })
        }catch(error){
          res.status(500).json({
            "error" : error
          })
        }
}

export async function updateDrivewayById(req:Request, res:Response){ // Makes game booked = true
    
    const gameDate = req.params.gameDate.trim()
    const drivewayId = req.params.drivewayId

       if(!drivewayId || !gameDate){
            return res.status(400).json({message : 'You`re missing parameters'})
        }
       if(!mongoose.Types.ObjectId.isValid(drivewayId)){
            return res.status(400).json({message : "invalid id"})
       }
       try{
           const updatedDriveway = await DrivewayManager.updateDrivewayById(drivewayId,gameDate)
           return res.status(201).json({
             updatedDriveway : updatedDriveway
           })

       }catch(error){
        res.status(500).json({
            error : error
        })
       }
}

export async function blockGame(req: Request, res: Response){
  const drivewayId = req.params.drivewayId;
  const gameDate = req.params.gameDate.trim();
    if (!drivewayId || !gameDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  try{
    const updatedDriveway = await DrivewayManager.blockGame(drivewayId,gameDate)
    return res.status(201).json({
      updatedDriveway
    })
  }catch(error){
    return res.status(500).json({
      "error" : error
    })
  }
}


export async function unblockGame(req: Request, res: Response) {
  const gameDate = req.params.gameDate.trim();
  const drivewayId = req.params.drivewayId;

  if (!drivewayId || !gameDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const updatedDriveway = await DrivewayManager.unblockGame(
      drivewayId,
      gameDate
    );

    return res.status(200).json(
      { "updatedDriveway" : updatedDriveway }
    );
  } catch (error) {
    res.status(500).json({ error });
  }
}

export async function updateDrivewayCancleBooking(req: Request, res: Response){
    const gameDate = req.params.gameDate.trim()
    const drivewayId = req.params.drivewayId

       if(!drivewayId || !gameDate){
            return res.status(400).json({message : 'You`re missing parameters'})
        }
       if(!mongoose.Types.ObjectId.isValid(drivewayId)){
            return res.status(400).json({message : "invalid id"})
       }
       try{
        const updatedDriveway = await DrivewayManager.updateDrivewayCancelBooking(drivewayId,gameDate)
        return res.json({ message: "cancled booking", driveway: updatedDriveway });
       }catch(error:any){
          console.error("Error updating game availability:", error.message);
           return res.status(400).json({ message: error.message });
       }
}


export async function getAllDrivewaysByUserId(req: Request, res: Response){
      const userId = req.params.userId
      if(!userId){
         return res.status(400).json({Message : "missing driveway Id."})
      }
      if(!mongoose.Types.ObjectId.isValid(userId)) {
          res.status(400).json({ error: "Invalid drivewayId format" });
          return
      }
      try{
        const driveways = await DrivewayManager.getAlldrivewaysByUserId(userId)
        return res.status(200).json({
           driveways
        })
      }catch(error){
        return res.status(500).json({error})
      }


} 


export function deleteDriveway(req:Request, res:Response){
}

