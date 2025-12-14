import mongoose from "mongoose";
import { DrivewayManager } from "./manager";
import { Request, Response } from "express";
import { drivewayModel } from "./model";


export async function addDriveway(req:Request, res:Response){
    
    const {ownerId,address,walk,stadium,price,image,description} = req.body
    if(!ownerId || !address || !walk || !stadium || !price || !image || !description){
        return res.status(400).json({Message : 'You`re missing parameters'})
    }
     try{
        const newDriveway = await DrivewayManager.createDriveway(req.body)
        return res.status(201).json({
            "Created new driveway" : newDriveway
        })
        }catch(error){
            return res.status(500).json({
                error : "internal server error"
            })
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



export function updateDrivewayById(req:Request, res:Response){
    
}




export function deleteDriveway(req:Request, res:Response){
    
}