import express from 'express'
import multer from 'multer';
import {Router} from 'express'
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { authorize } from '../../utils/middleware/authorize';
import { requireUserOwnership,requireDrivewayOwnership } from '../../utils/middleware/ownershipMiddleware';
import { addDriveway, getAllDriveways, getDrivewayById,getAllDrivewaysByUserId, updateDrivewayById,getGamesByOwnerId, unblockGame, updateDrivewayCancleBooking,blockGame,getAllRulesByDrivewayId, updateDriveway } from './controller';
import { upload } from '../../utils/middleware/multerUpload';
import { ImagesValidation } from '../../utils/middleware/imagesValidation';

const drivewayRouter = express.Router();

drivewayRouter.post(
    '/',
    authenticateToken,
    upload.array('images', 5),   // Multer FIRST
    ImagesValidation,            // Validation AFTER Multer
    addDriveway
);

drivewayRouter.get('/',getAllDriveways)

drivewayRouter.get('/:drivewayId',getDrivewayById)

drivewayRouter.get('/getGames/:ownerId',authenticateToken,getGamesByOwnerId)

drivewayRouter.get('/rules/:drivewayId',authenticateToken,getAllRulesByDrivewayId)

drivewayRouter.get('/getAllDrivewaysByUserId/:userId',authenticateToken,requireUserOwnership,getAllDrivewaysByUserId) 

drivewayRouter.put('/:drivewayId/:gameDate',authenticateToken,updateDrivewayById)

drivewayRouter.put('/:drivewayId',authenticateToken,updateDriveway)

drivewayRouter.put('/:drivewayId/block/:gameDate',authenticateToken,requireDrivewayOwnership,blockGame)

drivewayRouter.put('/:drivewayId/unblock/:gameDate',authenticateToken,requireDrivewayOwnership,unblockGame);

drivewayRouter.put('/updateDrivewayCancleBooking/:drivewayId/:gameDate',authenticateToken,requireDrivewayOwnership,updateDrivewayCancleBooking)

export default drivewayRouter

