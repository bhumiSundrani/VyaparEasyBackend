import UserModel from '../../models/User.model'
import { setCache } from '../../caching/setCache'
import { AuthRequest } from '../../types/AuthRequest'
import { Response } from 'express'
import { User } from '../../types/User'

export async function getUser(req: AuthRequest, res: Response){
    try {
        const userReq = req.user as User
        
        const user = await UserModel.findOne({ phone: userReq.phone })
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found in database",
                user: null
            })
        }

        const responseData = {
            success: true,
            message: "User data found",
            user: {
                phone: user.phone,
                name: user.name,
                shopName: user.shopName,
                preferredLanguage: user.preferredLanguage
            }
        }

        await setCache(`${req.originalUrl}:${user._id}`, responseData, 360000)

        return res.status(200).json(responseData)
    } catch (error) {
        console.error("Error in get-user route:", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            user: null
        })
    }
}