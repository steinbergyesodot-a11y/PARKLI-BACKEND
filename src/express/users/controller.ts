import { NextFunction, Request,Response } from 'express';
import { UsersManager } from './manager';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";
import { userModel } from './model';
import Stripe from 'stripe';
import { UserType } from './interface';

export async function addUser(req: Request, res: Response, next: NextFunction) {
    const { firstName, lastName, email, password, roles } = req.body;
    if (!firstName || !lastName || !email || !password || !roles) {
        return next(new Error("You're missing parameters"));
    }
    const exists = await userModel.findOne({email})
    if(exists){
        return next(new Error("Email already in use"))
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UsersManager.createUser({
            firstName,
            lastName,
            email,
            userType: UserType.Guest,
            password: hashedPassword,
            roles
        });

        return res.status(201).json({
            message: "Created user successfully!"
        });

    } catch (error) {
        next(error); 
    }
}


export async function getUserById(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;
    if (!userId) {
        return next(new Error("Missing user ID."));
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid userId format."));
    }

    try {
        const user = await UsersManager.getUserById(userId);

        if (!user) {
            throw new Error("User not found")
        }

        return res.status(200).json({ user });

    } catch (error) {
        next(error);
    }
}



export async function getAllUsers(req:Request,res:Response,next:NextFunction){
      try{
            const users = await UsersManager.getAllUsers()
            if (users.length === 0) {
                return next(new Error("Could'nt find any users"));

            }
            res.status(200).json({"found users":users})
         }catch(error){
           next(error)
         }
}

export async function deleteUserById(req:Request,res:Response){

}


export async function updateFirstName(req:Request,res:Response,next:NextFunction){
    const userId = req.params.userId as string
    const firstName = req.params.firstName
    if(!userId){
        return next(new Error("Missing user ID"))
    }
    if(!mongoose.Types.ObjectId.isValid(userId)) {
       return next(new Error("Invalid user id format"))
    }
     if(!firstName){
        return next(new Error("missing user first name"))
    }
    try{
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {firstName: firstName},
            {new:true}
        )
        res.status(201).json({
            message: "updated Name",
            updatedUser
        })
    }catch(error){
       next(error)
    }
}

export async function updateLastName(req:Request,res:Response,next:NextFunction){
    const userId = req.params.userId as string
    const lastName = req.params.lastName
    if(!userId){
                return next(new Error("Missing user ID"))

    }
    if(!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user id format"))

    }
     if(!lastName){
        return next(new Error("missing user last name"))

    }
    try{
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {lastName: lastName},
            {new:true}
        )
        res.status(201).json({
            message: "updated Name",
            updatedUser
        })
    }catch(error){
      next(error)
    }
}

export async function updateEmail(req:Request,res:Response,next:NextFunction){
    const userId = req.params.userId as string
    const email = req.params.email
    if(!userId){
                return next(new Error("Missing user ID"))

    }
    if(!mongoose.Types.ObjectId.isValid(userId)) {
               return next(new Error("Invalid user id format"))

    }
     if(!email){
                return next(new Error("missing user first name"))

    }
    try{
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {email: email},
            {new:true}
        )
        res.status(201).json({
            message: "updated email address",
            updatedUser
        })
    }catch(error){
        next(error)
    }
}




export async function Login(req:Request,res:Response,next:NextFunction){
    const {email,password} = req.body
    if (!email || !password) {
        return next(new Error("Email and password are required"))
    }
    try{
        const userFound = await UsersManager.Login(email,password)
        if(userFound.success === false){
            return next(new Error("Email or password invalid!"))
        }
        if (!userFound.success || !userFound.user){ 
            return next(new Error("Email or password invalid!"))
        }
        const payload = {
            firstName: userFound.user?.firstName,
            lastName: userFound.user?.lastName,
            _id : userFound.user._id,
            roles : userFound.user.roles,
            email: userFound.user?.email,
            drivewayIds : userFound.user.drivewayIds,
            authProvider: userFound.user.authProvider
        };
        if (!process.env.JWT_SECRET_KEY) {
             throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET_KEY,
            {
            expiresIn: '1h'
            }
        )
        return res.status(200).json({
             message: 'Login successful', token ,payload
        });
    }catch(error){
       next(error)
    }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export async function googleLogin(req:Request,res:Response,next:NextFunction) {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
        return next(new Error("missing access token"))
    }

    // 1. Verify Google token
    const ticket = await client.getTokenInfo(accessToken);

    const email = ticket.email;
    const googleId = ticket.sub;

    // 2. Check if user exists in your DB
    let user = await userModel.findOne({ email });
    const firstName = email?.split("@")[0] ?? "unknown";
    
    // 3. If not, create a new user automatically
    if (!user) {
      user = await userModel.create({
        firstName,
        email,
        googleId,
        roles: ["renter"], // or whatever default roles you use
        drivewayIds: [],
        authProvider: "google"
      });
    }

    // 4. Build the SAME payload as your normal login
    const payload = {
      name: user.firstName,
      _id: user._id,
      roles: user.roles,
      email: user.email,
      drivewayIds: user.drivewayIds
    };

    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not defined");
    }

    // 5. Create the SAME JWT as your normal login
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h"
    });

    // 6. Send it back
    return res.status(200).json({
      message: "Google login successful",
      token,
      payload
    });

  } catch (error) {
    next(error);
  }
}

// export async function completeStripeOnboarding(req: Request, res: Response, next: NextFunction) {
//     const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
//     const userId = req.params.userId as string;

//     // 1. Validate userId
//     if (!userId) {
//         return next(new Error("Missing user ID"));
//     }

//     try {
//         // 2. Find user
//         const user = await userModel.findById(userId);

//         if (!user) {
//             return next(new Error("User not found"));
//         }

//         if (!user.stripeAccountId) {
//             return next(new Error("Stripe account not found for this user"));
//         }

//         // 3. Retrieve Stripe account
//         const account = await stripe.accounts.retrieve(user.stripeAccountId);

//         // 4. Check onboarding completion
//         if (account.details_submitted && account.charges_enabled) {
//             user.isStripeVerified = true;
//             await user.save();
//         }

//         // 5. Redirect back to frontend
//         return res.redirect("http://localhost:5173");

//     } catch (error) {
//         next(error); // Pass ALL errors to your error middleware
//     }
// }





// controllers/stripeController.js

// export const refreshStripeOnboarding = async (req:Request, res:Response, next:NextFunction) => {
//         const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

//   try {
//     const userId = req.query.userId;
//     const user = await userModel.findById(userId);

//     const link = await stripe.accountLinks.create({
//       account: user.stripeAccountId,
//       refresh_url: `${process.env.BACKEND_URL}/api/users/stripe/onboarding/refresh?userId=${userId}`,
//       return_url: `${process.env.BACKEND_URL}/api/users/stripe/onboarding/complete?userId=${userId}`,
//       type: "account_onboarding"
//     });
//     res.redirect(link.url);
//   } catch (err) {
//     next(err)
//   }
// };


export async function checkStripeStatus(req:Request, res:Response, next:NextFunction) {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.json({ verified: false });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const verified =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    if (verified && !user.isStripeVerified) {
      user.isStripeVerified = true;
      await user.save();
    }

    return res.json({ verified });
  } catch (err) {
    next(err);
  }
}

