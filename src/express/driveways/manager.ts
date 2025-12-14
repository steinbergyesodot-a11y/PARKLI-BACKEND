import { IDriveway } from "./interfce"
import { drivewayModel } from "./model"

export class DrivewayManager{
    static async createDriveway(driveway : IDriveway){
        return await drivewayModel.create(driveway)
    } 

    static async findDrivewayById(drivewayId : string){
        return await drivewayModel.findById(drivewayId)
    }

    static async getAllDriveways(){
        const driveways = await drivewayModel.find()
        return driveways
    }
    
}