import { drivewayModel } from "./model"
import axios from 'axios';
import { getRedSoxHomeGamesNextMonth } from "../../utils/mlbAPI";
import { IDriveway,IGame } from "./interfce";
import { GameInfo } from "../../utils/mlbAPI";




export class DrivewayManager{
    static async createDriveway(driveway : IDriveway){

       const games: GameInfo[] = await getRedSoxHomeGamesNextMonth()

       return await drivewayModel.create({
             ...driveway,
              games: games 
        });
        
    } 

    static async findDrivewayById(drivewayId : string){
        return await drivewayModel.findById(drivewayId)
    }

    static async getAllDriveways(){
        const driveways = await drivewayModel.find()
        return driveways
    }
    
}