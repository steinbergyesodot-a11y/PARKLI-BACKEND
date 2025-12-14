import { Request,Response,NextFunction } from "express";

function errorHandler(err: Error,req:Request,res:Response,next:NextFunction): void{
    res.status(400).json({
        success: false,
        error: err.message
    })
}

export default errorHandler