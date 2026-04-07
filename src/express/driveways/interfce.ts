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
    zipcode?: string;                    
    latitude: number;                   
    longitude: number;                  
    publicDisplay?: string;              // Virtual: auto-computed from city, state, zipcode
    walk: string;
    price: number;
    images: string[];
    rules: string[];
    description: string;
    isStripeVerified?: boolean;
    games?: IGame[];
}