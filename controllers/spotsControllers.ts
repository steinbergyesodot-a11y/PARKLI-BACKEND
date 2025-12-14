import { Response,Request, NextFunction } from "express";


export async function addSpot(req: Request,res: Response,next:NextFunction){
  
    // const userId = req.user.id
    // const {address,image,stadium,price,walk,description} = req.body

    // const spot = new Spot({
    //       userId,
    //       address,
    //       stadium,
    //       walk,
    //       price,
    //       image,
    //       description
    // });
    // try{
    //     await spot.save();
    //     res.status(201).json({ success: true, spot });

    // }catch(error){
    //     res.status(200).json({"error":error})
    // }
}


// export async function getAllSpots(req: Request,res: Response,next:NextFunction){
//     const spots = await Spot.find();
//     res.send(spots)
// }


// export async function getSpot(req: Request, res:Response){
//     try{
//         const id = req.params.id
//         const spot = await Spot.findOne({_id: id})
//         if(!spot){
//             return res.status(400).json({
//                 message: "no such id"
//             })
//         }
//         res.json({spot})

//     }catch(err){
//         res.send(err)
//     }

// }