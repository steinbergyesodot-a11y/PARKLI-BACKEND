import { Types } from "mongoose";





export interface IGame {
  visiting_team: string;
  game_time: string,
  date: string;
  booked: boolean
}



export interface IDriveway {
    ownerId: Types.ObjectId;
    address: string;
    walk: string;
    price: number;
    images: string[];
    description: string;
    games?: IGame[];
}