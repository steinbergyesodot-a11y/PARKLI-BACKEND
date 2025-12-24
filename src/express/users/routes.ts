import express from 'express'
import { Router } from 'express'
import { addUser, getAllUsers, getUserById, Login } from './controller';

const usersRouter = express.Router();



usersRouter.post("/addUser",addUser)

usersRouter.get("/:userId",getUserById)

usersRouter.get("/",getAllUsers)

usersRouter.post('/login',Login)



export default usersRouter