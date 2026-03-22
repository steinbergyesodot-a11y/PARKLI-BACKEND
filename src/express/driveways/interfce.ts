import { Types } from "mongoose";


export interface IGame {
  visiting_team: string;
  game_time: string,
  parkingBegins: string;
  date: string;
  booked: boolean;
  blocked: boolean;
}



export interface IDriveway {
    ownerId: Types.ObjectId;
    name: string;
    address: string;
    city: string;                       
    state: string;                      
    latitude: number;                   
    longitude: number;                  
    publicDisplay: string;               
    walk: string;
    price: number;
    images: string[];
    rules: string[];
    description: string;
    isStripeVerified?: boolean;
    games?: IGame[];
}