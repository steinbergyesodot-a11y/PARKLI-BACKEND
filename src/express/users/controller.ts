import { NextFunction, Request,Response } from 'express';
import { UsersManager } from './manager';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import { OAuth2Client } from "google-auth-library";
import { userModel } from './model';
import Stripe from 'stripe';
import { UserType } from './interface';
import { userSchemaZod,loginSchemaZod, resetPasswordSchemaZod } from './validation';
import { clean } from '../../utils/sanitizeHTML';
import { logger } from '../../utils/logger/logger';
import { responseWrapper,ApiResponse } from '../../utils/responseWrapper';
import { json } from 'zod';
import crypto from 'crypto'
import { Resend } from 'resend';


export async function addUser(req: Request, res: Response, next: NextFunction) {

  logger.info({
    message: "addUser called",
    ip: req.ip
  });

  try {
    const data = userSchemaZod.parse(req.body);

    const firstName = clean(data.firstName);
    const lastName = clean(data.lastName);
    const email = clean(data.email).toLowerCase().trim();

    logger.info({
      message: "Attempting to create user",
      email,
      ip: req.ip
    });

    const exists = await userModel.findOne({ email });
    if (exists) {
      logger.warn({
        message: "User creation failed: email already exists",
        email,
        ip: req.ip
      });
      return next(new Error("Unable to create account"));
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const newUser =  await UsersManager.createUser({
      firstName,
      lastName,
      email,
      userType: UserType.Guest,
      password: hashedPassword,
      roles: ["renter"],
    });

    logger.info({
      message: "User created successfully",
      email,
      ip: req.ip
    });

    return res
       .status(201)
       .json(
        responseWrapper(true,{id: newUser._id, email: newUser.email}, null)
       )

  } catch (err: any) {
    logger.error({
      message: "Error in addUser",
      error: err.message,
      stack: err.stack,
      ip: req.ip
    });
    return next(err);
  }
}


export async function getUserById(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId as string;
    logger.info({
        message: "getUserById called",
        userId,
        ip: req.ip
    });

    if (!userId) {
        logger.warn({
            message: "Missing user ID",
            ip: req.ip
        });
        return next(new Error("Missing user ID."));
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        logger.warn({
            message: "Invalid userId format",
            userId,
            ip: req.ip
        });
        return next(new Error("Invalid userId format."));
    }

    try {
        const user = await UsersManager.getUserById(userId);

        if (!user) {
            logger.warn({
                message: "User not found",
                userId,
                ip: req.ip
            });
            throw new Error("User not found");
        }

        logger.info({
            message: "User fetched successfully",
            userId
        });

        return res
          .status(200)
          .json(
            responseWrapper(true,user,null)
           );

    } catch (error: any) {
        logger.error({
            message: "Error in getUserById",
            error: error.message,
            stack: error.stack,
            userId
        });
        next(error);
    }
}


export async function getAllUsers(req: Request, res: Response, next: NextFunction) {
    logger.info({
        message: "getAllUsers called",
        ip: req.ip
    });

    try {
        const users = await UsersManager.getAllUsers();

        if (users.length === 0) {
            logger.warn({
                message: "No users found",
                ip: req.ip
            });
            return next(new Error("Couldn't find any users"));
        }

        logger.info({
            message: "Users fetched successfully",
            count: users.length,
            ip: req.ip
        });

        return res
           .status(200)
           .json(
            responseWrapper(true,users,null)
           );

    } catch (error: any) {
        logger.error({
            message: "Error in getAllUsers",
            error: error.message,
            stack: error.stack,
            ip: req.ip
        });
        next(error);
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
        res
        .status(201)
        .json(
            responseWrapper(true,updatedUser,null)
        )

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
        res
        .status(201)
        .json(
            responseWrapper(true,updatedUser,null)
        )
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
        res
        .status(201)
        .json(
            responseWrapper(true,updatedUser,null)
        )
    }catch(error){
        next(error)
    }
}




export async function Login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = loginSchemaZod.parse(req.body);

    // Log the incoming login attempt
    logger.info({
        message: "Login attempt",
        email,
        ip: req.ip
    });

    try {
        const userFound = await UsersManager.Login(email, password);

        if (!userFound.success) {
            // Log detailed failed login information
            logger.warn({
                message: "Login failed",
                email,
                ip: req.ip,
                reason: userFound.message,
                isLocked: userFound.isLocked || false,
                failedAttempts: userFound.failedAttempts || 0,
                accountLocked: userFound.accountLocked || false
            });

            // If account is now locked, alert the user
            if (userFound.accountLocked) {
                logger.warn({
                    message: "SECURITY: Account locked due to multiple failed login attempts",
                    email,
                    ip: req.ip,
                    failedAttempts: userFound.failedAttempts
                });
            }

            return next(new Error(userFound.message || "Email or password invalid!"));
        }

        if (!userFound.user) {
            logger.warn({
                message: "Login failed: user object missing",
                email,
                ip: req.ip
            });
            return next(new Error("Email or password invalid!"));
        }

        const payload = {
            firstName: userFound.user.firstName,
            lastName: userFound.user.lastName,
            _id: userFound.user._id,
            roles: userFound.user.roles,
            email: userFound.user.email,
            drivewayIds: userFound.user.drivewayIds,
            authProvider: userFound.user.authProvider
        };

        if (!process.env.JWT_SECRET_KEY) {
            logger.error({
                message: "JWT secret missing",
                email,
                ip: req.ip
            });
            throw new Error("JWT_SECRET is not defined in environment variables");
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h"
        });

        logger.info({
            message: "Login successful - account lockout reset",
            email,
            userId: userFound.user._id,
            ip: req.ip
        });

        return res
         .status(200)
         .json(
            responseWrapper(true,{token,payload})
         )

    } catch (error: any) {
        logger.error({
            message: "Error in Login endpoint",
            error: error.message,
            stack: error.stack,
            email,
            ip: req.ip
        });
        next(error);
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
        roles: ["renter"], 
        userType: UserType.Guest,
        drivewayIds: [],
        authProvider: "google"
      });
    }

    // 4. Build the SAME payload as your normal login
 const payload = {
  firstName: user.firstName,
  lastName: user.lastName || "",  // Add this
  _id: user._id,
  roles: user.roles,
  email: user.email,
  drivewayIds: user.drivewayIds,
  authProvider: "google"
};
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not defined");
    }

    // 5. Create the SAME JWT as your normal login
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h"
    });

    return res
      .status(200)
      .json(
        responseWrapper(true,{token,payload})
      )

  } catch (error) {
    next(error);
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);
export async function forgotPassword(req:Request, res:Response, next:NextFunction){
   const { email } = req.body;

   const genericResponse = {
    success: true,
    message: "If an account exists, a reset link has been sent."
  };

  try{
    const user = await userModel.findOne({email})
     if (!user) {
      return res.status(200).json(genericResponse);
    }
      const resetToken = crypto.randomBytes(32).toString("hex");
         const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

       const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        await resend.emails.send({
      from: "noreply@wrigleyparkli.com",
      to: email,
      subject: "Reset your password",
      html: `
        <p>Hello,</p>
        <p>You requested a password reset. Click the link below:</p>
        <p><a href="${resetURL}">Reset Password</a></p>
        <p>This link expires in 10 minutes.</p>
        <p>If you did not request this, ignore this email.</p>
      `
    });

      return res.status(200).json(genericResponse);

  }catch(error){
      console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }

}

export async function resetPassword(req:Request, res:Response, next:NextFunction){

  const { token } = req.params;
  const { password } = req.body;

  try {
    // Validate password
    const validation = resetPasswordSchemaZod.safeParse({ password });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message
      });
    }

    // 1. Hash the token from the URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    // 2. Find user with matching token + valid expiration
    const user = await userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token is invalid or has expired"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);


    // 3. Update password
    user.password = hashedPassword;

    // 4. Delete reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // 5. Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}



export async function checkStripeStatus(req:Request, res:Response, next:NextFunction) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  try {
    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.status(200).json(responseWrapper<{verified: boolean}>(true, { verified: false }));
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

    return res.status(200).json(responseWrapper<{verified: boolean, isStripeVerified?: boolean}>(true, { verified, isStripeVerified: user.isStripeVerified }));
  } catch (err) {
    next(err);
  }
}


export async function checkStripeVerification(req: Request, res: Response, next: NextFunction) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId);

    if (!user || !user.stripeAccountId) {
      return res.status(200).json(
        responseWrapper<{ isStripeVerified: boolean, onboardingUrl?: string }>(
          true, 
          { isStripeVerified: false }
        )
      );
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const isVerified =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    if (isVerified !== user.isStripeVerified) {
      user.isStripeVerified = isVerified;
      await user.save();
    }

    // If not verified, check if onboarding URL is expired and regenerate if needed
    if (!isVerified) {
      if (!user.stripeOnboardingUrl || (user.stripeOnboardingUrlExpires && new Date() > user.stripeOnboardingUrlExpires)) {
        const returnUrl = `${process.env.FRONTEND_URL}/Onboard-Complete`;
        const refreshUrl = `${process.env.FRONTEND_URL}/Onboard-Retry`;
        
        const onboardingLink = await stripe.accountLinks.create({
          account: user.stripeAccountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: "account_onboarding"
        });
        
        user.stripeOnboardingUrl = onboardingLink.url;
        user.stripeOnboardingUrlExpires = new Date(onboardingLink.expires_at * 1000);
        await user.save();
      }
    }

    return res.status(200).json(
      responseWrapper<{ isStripeVerified: boolean, onboardingUrl?: string }>(
        true, 
        { isStripeVerified: isVerified, onboardingUrl: !isVerified ? user.stripeOnboardingUrl : undefined }
      )
    );
  } catch (err) {
    next(err);
  }
}