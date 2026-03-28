import { Request,Response,NextFunction } from "express";
import { BookingModel } from "../../express/bookings/model";

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

export async function requireBookingOwnership(req:Request, res:Response, next:NextFunction) {
  try {
    const bookingId = req.params.bookingId || req.body.bookingId;
    const loggedInUserId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({ message: "Missing booking ID" });
    }

    const booking = await BookingModel.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const isRenter = booking.renterId.toString() === loggedInUserId;
    const isOwner = booking.ownerId.toString() === loggedInUserId;

    if (!isRenter && !isOwner) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Error validating booking ownership" });
  }
}



// A hacker can modify a url, so he can change the user id url to another user. But, he can't modify
// a jwt. Therefor, we check to make sure the userId of the url is the same userId that he got from 
// the jwt.