import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();




// export async function Login(req: Request,res: Response,next:NextFunction){
  
//     const {email,password} = req.body

//     if (!email || !password) {
//     res.status(400).json({ error: 'Email and password are required' });
//     }

//     try{
//         const user = await User.findOne({ email: req.body.email})
        
//         if (!user) {
//            res.status(401).json({ error: 'Invalid email or password' });
//            return;
//         }
//         const isMatch = await bcrypt.compare(password, user.password);
        

//         if (!isMatch) {
//            res.status(401).json({ error: 'Invalid email or password' });
//            return
//         }

      
//         const payload = {name: user.firstName, id: user._id};
        
        
        // if (!process.env.JWT_SECRET_KEY) {
        //      throw new Error("JWT_SECRET is not defined in environment variables");
        // }

//         const token = jwt.sign(
//             payload,
//             process.env.JWT_SECRET_KEY,
//             {
//             expiresIn: '1h'
//             }
//         )
        
//         res.status(200).json({ message: 'Login successful', token });
//     }catch(error){
//         next(error)
//     }
//   }

