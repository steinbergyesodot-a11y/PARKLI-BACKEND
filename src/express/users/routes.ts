import express from 'express'
import { Router } from 'express'
import { addUser, getAllUsers, getUserById, Login,googleLogin,updateFirstName,updateLastName,updateEmail } from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';

const usersRouter = express.Router();



usersRouter.post("/addUser",addUser)

usersRouter.get("/:userId",getUserById)

usersRouter.put("/:userId/firstName/:firstName",updateFirstName)

usersRouter.put("/:userId/lastName/:lastName",updateLastName)

usersRouter.put("/:userId/email/:email",updateEmail)

usersRouter.get("/",getAllUsers)

usersRouter.post('/login',Login)

usersRouter.post('/googleLogin',googleLogin)



export default usersRouter