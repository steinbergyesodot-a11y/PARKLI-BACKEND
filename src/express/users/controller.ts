import { NextFunction, Request,Response } from 'express';
import { UsersManager } from './manager';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';



export async function addUser(req:Request,res:Response){
    const {firstName,lastName,email,password,roles} = req.body?? {}
    if(!firstName || !lastName || !email || !password || !roles){
        return res.status(400).json({Message : 'You`re missing parameters'})
    }

    try{
        const hashedPassword = await bcrypt.hash(password, 10); 
        const newUser = await UsersManager.createUser({
            firstName,
            lastName,
            email,
            password : hashedPassword,
            roles
        })
        return res.status(201).json({
            Message: "Created user successfully!"
        })
    }catch(error){
        return res.status(500).json({
            "error" : error
        })
    }
}


export async function getUserById(req:Request,res:Response){
    const userId = req.params.userId
    if(!userId){
        return res.status(400).json({Message : "missing user Id."})
    }
    if(!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ error: "Invalid playerId format" });
        return
    }
    try{
        const user = await UsersManager.getUserById(userId)
        if(user){
            res.status(200).json({
                user
            })
        }
        else{
            return res.status(404).json({ message: "User not found." });
        }
    }catch(error){
        res.status(500).json({
            error : "server error"
        })
    }
}



export async function getAllUsers(req:Request,res:Response){
      try{
            const users = await UsersManager.getAllUsers()
            if (users.length === 0) {
                  return res.status(404).json({ message: "No users found" });
            }
            res.status(200).json({users})
         }catch(error){
            res.status(500).json({
                error : "internal server error"
            })
         }
}

export async function deleteUserById(req:Request,res:Response){

}


export async function updateUserById(req:Request,res:Response){
     
}




export async function Login(req:Request,res:Response,next:NextFunction){
    const {email,password} = req.body

    if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
    }
    try{
        const userFound = await UsersManager.Login(email,password)
        if(userFound.success === false){
            return res.status(400).json({
                message : "Email or password invalid!"
            })
        }
        if (!userFound.success || !userFound.user){ 
            return res.status(400).json({
                 message: "Email or password invalid!"
            });
        }

        
        
        const payload = {
            name: userFound.user?.firstName,
            _id : userFound.user._id,
            roles : userFound.user.roles,
            email: userFound.user?.email,
            drivewayIds : userFound.user.drivewayIds
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

export async function googleLogin(req:Request,res:Response,next:NextFunction){
    
}


