export interface IUser{
    firstName: string;
    lastName:string;
    email:string;
    password: string;
    userType: "Renter" | "Host";
    drivewayIds?: string[]
}