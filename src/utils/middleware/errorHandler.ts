import { Request,Response,NextFunction } from "express";

function errorHandler(err: Error,req:Request,res:Response,next:NextFunction){
    ///     U S E R S  C O N T R O L L E R   E R R O R S 
    if (err.message === "User not found") {
        return res.status(404).json({ error: "No such user exists" });
    }
    if(err.message === "Missing user ID"){
        return res.status(400).json({error : "You are missing user ID"})
    }
    if(err.message === "missing user first name"){
        return res.status(400).json({error : "You are missing user first name"})
    }
    if(err.message ==="Email or password invalid!"){
        return res.status(401).json({error : "Email are password you entered are'nt correct"})

    }
    if(err.message === "missing access token"){
        return res.status(400).json({error : "Missing access token"})

    }
    if (err.message === "Stripe account not found for this user") {
    return res.status(404).json({
        error: "Stripe account not found for this user"
    });
    }

    ////////     B O O K I N G  C O N T R O L L E R  E R R O R S
    if(err.message === "invalid ids"){
        return res.status(400).json({error : "invalid ids"})
    }
    if(err.message === "invalid date or time format"){
        return res.status(400).json({error : "invalid date or time format"})
    }
    if (err.message === "Host not found") {
        return res.status(404).json({
            error: "Host not found"
        });
    }
    if (err.message === "driveway not found") {
        return res.status(404).json({
            error: "Driveway not found"
        });
    }
    if (err.message === "Host has not started Stripe onboarding yet") {
        return res.status(400).json({
            error: "Host has not started Stripe onboarding yet"
        });
    }

    if (err.message === "Host has not completed Stripe onboarding") {
        return res.status(400).json({
            error: "Host has not completed Stripe onboarding"
        });
    }
    if (err.message === "Missing renter ID" ||
        err.message === "Invalid renterId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "No bookings found for this renter") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing booking ID" ||
        err.message === "Invalid bookingId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Booking not found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing user ID" ||
        err.message === "Invalid userId format") {
        return res.status(400).json({ error: err.message });
    }
    ////     D R I V E W A Y S   C O N T R O L L E R S  E R R O R S 
    if (err.message === "You're missing parameters" ||
        err.message === "Invalid ownerId format" ||
        err.message === "Invalid rules format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "User not found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing driveway ID" ||
        err.message === "Invalid drivewayId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Driveway not found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "No driveways found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing owner ID" ||
        err.message === "Invalid ownerId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "You're missing parameters" ||
        err.message === "Invalid drivewayId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Driveway not found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing parameters" ||
        err.message === "Invalid drivewayId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Driveway not found") {
        return res.status(404).json({ error: err.message });
    }
    if (err.message === "Missing parameters" ||
        err.message === "Missing user ID" ||
        err.message === "Missing driveway ID" ||
        err.message === "Invalid userId format" ||
        err.message === "Invalid drivewayId format") {
        return res.status(400).json({ error: err.message });
    }
    if (err.message === "Driveway not found") {
        return res.status(404).json({ error: err.message });
    }

return res.status(500).json({ error: "Internal server error", details: err.message });
}

export default errorHandler