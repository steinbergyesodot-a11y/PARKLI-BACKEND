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
        
        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            return { success: false, message: "Invalid credentials" };
        }
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