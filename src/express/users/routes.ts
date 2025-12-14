import express from 'express'
import { Router } from 'express'
import { addUser, getAllUsers, getUserById } from './controller';

const usersRouter = express.Router();



usersRouter.post("/addUser",addUser)

usersRouter.get("/:userId",getUserById)

usersRouter.get("/",getAllUsers)

// usersRouter.post('/Login',Login)


export default usersRouter