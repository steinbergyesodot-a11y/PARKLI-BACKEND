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

   static async getGamesByOwnerId(ownerId:string) {
  const driveway = await drivewayModel.findOne({ ownerId });
  return driveway?.games || [];
}


  static async updateDrivewayById(drivewayId: string, gameDate: string) {
   const normalized = gameDate.trim();

  return await drivewayModel.findOneAndUpdate(
    { _id: drivewayId },
    {
      $set: {
        "games.$[game].booked": true
      }
    },
    {
      arrayFilters: [{ "game.date": normalized }],
      new: true
    }
  );
}
      static async unblockDrivewayById(drivewayId: string, gameDate: string) {
const normalized = gameDate.trim();
        return await drivewayModel.findOneAndUpdate(
          { _id: drivewayId },
          {
            $set: {
              "games.$[game].booked": false
            }
          },
          {
            arrayFilters: [{ "game.date": normalized }],
            new: true
          }
        );
      }

   

}