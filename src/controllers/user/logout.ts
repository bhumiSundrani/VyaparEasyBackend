import { invalidateCache } from "../../caching/setCache";
import { verifyToken } from "../../lib/jwtTokenManagement";
import UserModel from "../../models/User.model";
import { User } from "../../types/User";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";

export async function logout(req: AuthRequest, res: Response){
    try {
            const user = req.user as User;
        await invalidateCache(`/api/user/get-user:${user.phone}`)
        await invalidateCache(`/api/products:${user.phone}`)
        await invalidateCache(`/api/get-notifications:${user.phone}`)
        await invalidateCache(`/api/categories:${user.phone}`)
        
        
        res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        });

        res.status(200).json({
        success: true,
        message: "Logged out successfully"
    })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Logged out failed"
        })
    }
    
}