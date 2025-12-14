import mongoose from 'mongoose';
import { IUser } from './interface';
import { userModel } from './model';

export class UsersManager{

    static async createUser(user:IUser){
        return userModel.create(user)
    }

    static async getUserById(userId : string){
        const user = await userModel.findById(userId)
        return user
    }
}