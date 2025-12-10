import express from 'express'
import {Router} from 'express'
import { addDriveway, deleteDriveway, getAllDriveways, getDrivewayById, updateDrivewayById } from './controller';


const drivewayRouter = express.Router();




drivewayRouter.post('/',addDriveway)

drivewayRouter.get('/:systemId',getDrivewayById)

drivewayRouter.get('/',getAllDriveways)

drivewayRouter.put('/:systemId',updateDrivewayById)

drivewayRouter.delete('/:systemId',deleteDriveway)



export default drivewayRouter

