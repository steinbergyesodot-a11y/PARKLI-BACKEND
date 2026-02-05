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
   
   const driveway = await drivewayModel.findById(drivewayId);
   if (!driveway) return null;
    if(driveway.games){
      const game = driveway.games.find(g => g.date === normalized);
      if (!game) return null;
      game.booked = true;
      await driveway.save();
      return driveway;
    }
   
  }
   static async unblockGame(drivewayId: string, gameDate: string){
            const normalized = gameDate.trim();
        return await drivewayModel.findOneAndUpdate(
          { _id: drivewayId },
          {
            $set: {
              "games.$[game].blocked": false
            }
          },
          {
            arrayFilters: [{ "game.date": normalized }],
            new: true
          }
        );
      }

      static async blockGame(drivewayId: string, gameDate: string){
            const normalized = gameDate.trim();
        return await drivewayModel.findOneAndUpdate(
          { _id: drivewayId },
          {
            $set: {
              "games.$[game].blocked": true
            }
          },
          {
            arrayFilters: [{ "game.date": normalized }],
            new: true
          }
        );
      }

     static async updateDrivewayCancelBooking(drivewayId: string, gameDate: string) {
         const driveway = await drivewayModel.findById(drivewayId);
          if (!driveway) {
            throw new Error("Driveway not found");
          }
          console.log("Driveway ID:", drivewayId); console.log("Incoming gameDate:", gameDate); console.log("Driveway.games:", driveway.games);

          if (!driveway.games || driveway.games.length === 0) {
            throw new Error("No games found for this driveway");
          }

          const game = driveway.games.find(g => g.date === gameDate);
          if (!game) {
            throw new Error("Game not found for this driveway");
          }

          game.booked = false;

          await driveway.save();

          return driveway;
   }

   static async getAlldrivewaysByUserId(userId:string){
     return await drivewayModel.find({ ownerId: userId }).lean(); 
   }


   

}