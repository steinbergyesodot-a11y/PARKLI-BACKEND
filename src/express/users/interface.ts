export interface IUser {
  firstName: string;
  lastName?: string;      // now optional
  email: string;
  password?: string;      // now optional
  roles: ("renter" | "host")[];
  drivewayIds?: string[];
  googleId?: string;
  authProvider?: string;
}
