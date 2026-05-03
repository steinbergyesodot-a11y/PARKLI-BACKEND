export enum UserType{
  Guest = "Guest",
  Admin = "Admin"
}

export interface IUser {
  firstName: string;
  lastName?: string;  
  userType: UserType;   
  email: string;
  password?: string;      
  roles: ("renter" | "host")[];
  stripeAccountId?: string;
  isStripeVerified?: boolean;
  drivewayIds?: string[];
  googleId?: string;
  authProvider?: string;
  failedAttempts?: Number;
  lastFailedAttempt?: Date;
  lockoutUntil?: Date;
  stripeOnboardingUrl?: string;
  stripeOnboardingUrlExpires?: Date;
  passwordResetToken?:string;
  passwordResetExpires?: number;
}
