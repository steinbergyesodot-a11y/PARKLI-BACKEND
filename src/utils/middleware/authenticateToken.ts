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
  
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY as string, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(403).json({ message: "Invalid token" });
    }

    // Validate payload shape
    if (!decoded || typeof decoded !== "object" || !("_id" in decoded)) {
      console.log("Token validation failed. Decoded:", decoded); // ADD THIS LINE
      return res.status(403).json({ message: "Malformed token payload" });
    }

    req.user = decoded;
    next();
  });
}
