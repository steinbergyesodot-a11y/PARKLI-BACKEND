export interface IUser{
    firstName: string;
    lastName:string;
    email:string;
    password: string;
    userType: "Renter" | "Driveway Owner";
    drivewayIds?: string[]
}