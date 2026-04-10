import express from 'express'
import { Router } from 'express'
import { addUser, getAllUsers, getUserById, checkStripeVerification,Login,googleLogin,updateFirstName,updateLastName,updateEmail,checkStripeStatus} from './controller';
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { authorize } from '../../utils/middleware/authorize';
import { requireUserOwnership } from '../../utils/middleware/ownershipMiddleware';
import { loginRateLimiter } from '../../utils/middleware/rateLimit';

const usersRouter = express.Router();


usersRouter.post("/addUser",addUser)

usersRouter.get("/:userId",authenticateToken,requireUserOwnership,getUserById)

usersRouter.put("/:userId/firstName/:firstName",authenticateToken,requireUserOwnership,updateFirstName)

usersRouter.put("/:userId/lastName/:lastName",authenticateToken,requireUserOwnership,updateLastName)

usersRouter.put("/:userId/email/:email",authenticateToken,requireUserOwnership,updateEmail)

usersRouter.get("/",authenticateToken,authorize,getAllUsers)

usersRouter.post('/login',loginRateLimiter,Login)

usersRouter.post('/google-login',googleLogin)

usersRouter.get('/stripe/check-status',authenticateToken,checkStripeStatus)

usersRouter.get('/:userId/stripe-verification', checkStripeVerification);



export default usersRouter