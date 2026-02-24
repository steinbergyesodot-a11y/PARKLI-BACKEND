import { Request,Response,NextFunction } from "express";

export function requireUserOwnership(req:Request, res:Response, next:NextFunction) {
  const loggedInUserId = req.user._id;
  const targetUserId = req.params.userId;

  if (loggedInUserId !== targetUserId) {
    return res.status(403).json({
      error: "You cannot modify another user's data"
    });
  }

  next();
}

export function requireDrivewayOwnership(req:Request, res:Response, next:NextFunction){
    const targetDrivewayId = req.params.drivewayId
    if (!req.user || !Array.isArray(req.user.drivewayIds)) { 
      return res.status(403).json({ message: "Unauthorized" });
    }
    const ownsDriveway = req.user.drivewayIds.includes(targetDrivewayId);
    if (!ownsDriveway) { 
      return res.status(403).json({ message: "Unauthorized" });
    } 
    next();

}



// A hacker can modify a url, so he can change the user id url to another user. But, he can't modify
// a jwt. Therefor, we check to make sure the userId of the url is the same userId that he got from 
// the jwt.