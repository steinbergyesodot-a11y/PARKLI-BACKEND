import { Request,Response } from 'express';
import { UsersManager } from './manager';
import mongoose from 'mongoose';


export async function addUser(req:Request,res:Response){

    const {firstName,lastName,email,password} = req.body
    if(!firstName || !lastName || !email || !password){
        return res.status(400).json({Message : 'You`re missing parameters'})
    }
    try{
        const newUser = await UsersManager.createUser(req.body)
        return res.status(201).json({
            "Created new user" : newUser
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