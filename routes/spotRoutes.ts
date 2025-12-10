import multer from 'multer';
import express from 'express'
import { Router } from 'express'
import { addSpot,getAllSpots,getSpot } from '../controllers/spotsControllers';
import { authenticateToken } from '../middleware/authenticateToken';


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const spotsRouter = express.Router();


spotsRouter.post("/addSpot",addSpot)

spotsRouter.get('/getAllSpots',getAllSpots)

spotsRouter.get('/getSpot/:id',getSpot)


export default spotsRouter