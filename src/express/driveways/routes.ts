import express from 'express'
import multer from 'multer';
import {Router} from 'express'
import { authenticateToken } from '../../utils/middleware/authenticateToken';
import { addDriveway, deleteDriveway, getAllDriveways, getDrivewayById, updateDrivewayById,getGamesByOwnerId, unblockDrivewayById, updateDrivewayCancleBooking } from './controller';
import { upload } from '../../utils/middleware/multerUpload';

const drivewayRouter = express.Router();




drivewayRouter.post(
    '/',
    authenticateToken,
    upload.array('images', 10),
    addDriveway
)

drivewayRouter.get('/:drivewayId',getDrivewayById)

drivewayRouter.get('/getGames/:ownerId',getGamesByOwnerId)

drivewayRouter.get('/',getAllDriveways)

drivewayRouter.put('/:drivewayId/:gameDate',updateDrivewayById)

drivewayRouter.put('/unblock/:drivewayId/:gameDate', unblockDrivewayById);

drivewayRouter.put('/updateDrivewayCancleBooking/:drivewayId/:gameDate',updateDrivewayCancleBooking)

drivewayRouter.delete('/:deleteDrivewayById',deleteDriveway)



export default drivewayRouter

