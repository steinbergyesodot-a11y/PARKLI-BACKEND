import { Types } from "mongoose";

export interface IBooking{
    drivewayId: Types.ObjectId;
    ownerId: Types.ObjectId;
    renterId: Types.ObjectId;
    address: string;
    price: number;
    gameDate: string;
    parkingTime: string;
    visiting_team: string;
    bookedAt?: Date;
}