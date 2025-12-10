import { Types } from "mongoose";

export interface IDriveway{
    ownerId: Types.ObjectId; 
    address: string;
    walk: string;
    stadium: string;
    price: number;
    image: string;
    description: string
}