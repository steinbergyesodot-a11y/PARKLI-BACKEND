import express from 'express'
import { Router } from 'express'
import { addUser,Login } from '../controllers/usersController';

const usersRouter = express.Router();


usersRouter.post("/addUser",addUser)

usersRouter.post('/Login',Login)


export default usersRouter