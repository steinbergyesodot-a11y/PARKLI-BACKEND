import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
  

export function authenticateToken(req: Request,res: Response,next: NextFunction){
   const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1]; 
   if (!token) return res.status(401).json({ message: 'Access token missing' });
  

   jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
         res.status(403).json({ message: 'Invalid token' });
      return;
      }
       (req as any).user = decoded;    

  
  next();
});

}