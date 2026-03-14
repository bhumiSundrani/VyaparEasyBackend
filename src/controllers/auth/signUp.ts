
import OtpVerificationModel from '../../models/OtpVerification.model'
import UserModel from '../../models/User.model'
import { signupSchema } from '../../schemas/signupSchema'
import { generateToken } from '../../lib/jwtTokenManagement'
import { AuthRequest } from '../../types/AuthRequest'
import { Response } from 'express'

export async function signUp(req: AuthRequest, res: Response){
    try{
        const body = req.body
        const parsed = signupSchema.safeParse(body)
        if(!parsed.success){
            console.log("Error parsing data: ", parsed.error.issues)
            return res.status(400).json({
                success: false,
                message: "Invalid Input"
            })
        }
        const {name, shopName, phone, preferredLanguage} = parsed.data
        const verifiedUser = await OtpVerificationModel.findOne({phone: `+91${phone}`})
        if(!verifiedUser || !verifiedUser.isVerified){
            return res.status(401).json({
                success: false,
                message: "User is not verified"
            })
        }
        const existingUser = await UserModel.findOne({
            phone
        })
        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already regiseterd"
            })
        }
        const newUser = new UserModel({
            name,
            shopName,
            phone: `+91${phone}`,
            preferredLanguage,
            isVerified: true
        })
        await newUser.save()
         const token = await generateToken({
            userId: newUser._id.toString(),
            phone: `+91${phone}`,
            name: newUser.name,
            shopName: newUser.shopName,
            preferredLanguage: newUser.preferredLanguage
        })
        if (token == null) {
             return res.status(500).json({
                success: false,
                message: "Error generating token"
            });
        }
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(201).json({
                success: true,
               message: "user registered successfully",
            user: newUser
            });
    }catch(error){
        console.error("Error registering user: ", error)
        return res.status(500).json({
            success: false,
            error: "Error registering the user"
        })
    }
}

