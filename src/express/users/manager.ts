import mongoose from 'mongoose';
import { IUser } from './interface';
import { userModel } from './model';
import bcrypt from 'bcrypt'


export class UsersManager{

    static async createUser(user:IUser){
        return userModel.create(user)
    }

    static async getUserById(userId : string){
        const user = await userModel.findById(userId)
        return user
    }

    static async getAllUsers(){
        const users = await userModel.find()
        return users
    }



    static async Login(email: string, password: string){
      try{
        const user = await userModel.findOne({ email });
        if (!user) {
          return { success: false, message: "Invalid credentials" };
        }
        
        // Check if account is locked
        if (user.lockoutUntil && new Date() < user.lockoutUntil) {
          const minutesRemaining = Math.ceil((user.lockoutUntil.getTime() - new Date().getTime()) / 60000);
          return { 
            success: false, 
            message: `Account locked. Try again in ${minutesRemaining} minutes.`,
            isLocked: true
          };
        }

        // Clear lockout if time has passed
        if (user.lockoutUntil && new Date() >= user.lockoutUntil) {
          await userModel.updateOne({ _id: user._id }, { lockoutUntil: null, failedAttempts: 0 });
          user.lockoutUntil = null;
          user.failedAttempts = 0;
        }
        
        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
          // Increment failed attempts
          const newFailedAttempts = (user.failedAttempts as number || 0) + 1;
          const updateData: any = { 
            failedAttempts: newFailedAttempts,
            lastFailedAttempt: new Date()
          };

          // Lock account after 5 failed attempts for 15 minutes
          if (newFailedAttempts >= 5) {
            const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
            updateData.lockoutUntil = lockoutUntil;
          }

          await userModel.updateOne({ _id: user._id }, updateData);
          
          return { 
            success: false, 
            message: "Invalid credentials",
            failedAttempts: newFailedAttempts,
            accountLocked: newFailedAttempts >= 5
          };
        }

        // Successful login - reset failed attempts
        await userModel.updateOne(
          { _id: user._id }, 
          { failedAttempts: 0, lastFailedAttempt: null, lockoutUntil: null }
        );

        return{
             success: true, user:user
        };
    }catch(error){
          return{
             success: false, message: "Server error"
        };
      }
    }

    
}