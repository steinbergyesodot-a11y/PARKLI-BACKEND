export interface IUser {
  firstName: string;
  lastName?: string;     
  email: string;
  password?: string;      
  roles: ("renter" | "host")[];
  stripeAccountId?: string;
  isStripeVerified?: boolean;
  drivewayIds?: string[];
  googleId?: string;
  authProvider?: string;
}
