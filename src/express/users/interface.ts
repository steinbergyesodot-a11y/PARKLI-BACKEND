export interface IUser{
    firstName: string;
    lastName:string;
    email:string;
    password: string;
    roles: ("renter" | "host")[];
    drivewayIds?: string[]
}