import express from 'express'
import { Router } from 'express'
import { addUser, getAllUsers, getUserById, Login,googleLogin,updateFirstName,updateLastName,updateEmail,checkStripeStatus} from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { authorize } from '../../utils/middleware/authorize';
import { requireUserOwnership } from '../../utils/middleware/ownershipMiddleware';

const usersRouter = express.Router();


usersRouter.post("/addUser",addUser)

usersRouter.get("/:userId",authenticateToken,authorize,requireUserOwnership,getUserById)

usersRouter.put("/:userId/firstName/:firstName",authenticateToken,requireUserOwnership,updateFirstName)

usersRouter.put("/:userId/lastName/:lastName",authenticateToken,requireUserOwnership,updateLastName)

usersRouter.put("/:userId/email/:email",authenticateToken,requireUserOwnership,updateEmail)

usersRouter.get("/",authenticateToken,authorize,getAllUsers)

usersRouter.post('/login',Login)

usersRouter.post('/google-login',googleLogin)

usersRouter.get('/stripe/check-status',authenticateToken,checkStripeStatus)



export default usersRouter