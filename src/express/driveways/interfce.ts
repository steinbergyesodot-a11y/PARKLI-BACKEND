import { Types } from "mongoose";

export interface driveway{
    ownerId: Types.ObjectId; 
    address: string;
    walk: string;
    stadium: string;
    price: number;
    image: string;
    description: string
}