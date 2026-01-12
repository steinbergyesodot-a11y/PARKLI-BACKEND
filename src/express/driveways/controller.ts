import mongoose from "mongoose";
import { DrivewayManager } from "./manager";
import { Request, Response } from "express";
import { drivewayModel } from "./model";
import { authenticateToken } from "../../utils/middleware/authenticateToken";
import cloudinary from "../../utils/config.cloudinary";
import { IDriveway,IGame } from "./interfce";
import { userModel } from "../users/model";
import drivewayRouter from "./routes";


export async function addDriveway(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];


    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path);
      imageUrls.push(result.secure_url);
    }

    const { ownerId, address, walk, price, description } = req.body;

    if (!ownerId || !address || !walk || !price || !description) {
      return res.status(400).json({ message: "You're missing parameters" });
    }

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ message: "invalid owner id" });
    }

    const drivewayData: IDriveway = {
      ownerId,
      address,
      walk,
      price,
      description,
      images: imageUrls
    };


    const newDriveway = await DrivewayManager.createDriveway(drivewayData);
    await userModel.findByIdAndUpdate( newDriveway.ownerId, { $push: { drivewayIds: newDriveway._id } } );

    return res.status(201).json({
      message: "Created new driveway",
      newDriveway
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

export async function updateDrivewayById(req:Request, res:Response){
    
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


export async function unblockDrivewayById(req: Request, res: Response) {
  const gameDate = req.params.gameDate.trim();
  const drivewayId = req.params.drivewayId;

  if (!drivewayId || !gameDate) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    const updatedDriveway = await DrivewayManager.unblockDrivewayById(
      drivewayId,
      gameDate
    );

    return res.status(200).json({ updatedDriveway });
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





export function deleteDriveway(req:Request, res:Response){
    
}