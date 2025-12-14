import express from 'express'
import multer from 'multer';
import { authenticateToken } from '../../../middleware/authenticateToken';
import {Router} from 'express'
import { addDriveway, deleteDriveway, getAllDriveways, getDrivewayById, updateDrivewayById } from './controller';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const drivewayRouter = express.Router();




drivewayRouter.post('/',addDriveway)

drivewayRouter.get('/:systemId',getDrivewayById)

drivewayRouter.get('/',getAllDriveways)

drivewayRouter.put('/:systemId',updateDrivewayById)

drivewayRouter.delete('/:systemId',deleteDriveway)



export default drivewayRouter

