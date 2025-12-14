import express from 'express'
import multer from 'multer';
// import { authenticateToken } from '../../../middleware/authenticateToken';
import {Router} from 'express'
import { addDriveway, deleteDriveway, getAllDriveways, getDrivewayById, updateDrivewayById } from './controller';

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });

const drivewayRouter = express.Router();




drivewayRouter.post('/',addDriveway)

drivewayRouter.get('/:drivewayId',getDrivewayById)

drivewayRouter.get('/',getAllDriveways)

drivewayRouter.put('/:drivewayId',updateDrivewayById)

drivewayRouter.delete('/:deleteDrivewayById',deleteDriveway)



export default drivewayRouter

