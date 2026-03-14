import { verifyToken } from './jwtTokenManagement';
import UserModel from '../models/User.model';
import { Request } from 'express';

export async function getUserFromToken(req: Request) {
    try {
        const token = req.cookies?.token
        
        if (!token) {
            return null;
        }

        const decodedToken = await verifyToken(token);
        if (!decodedToken) {
            return null;
        }

        const user = await UserModel.findOne({ phone: decodedToken.phone });
        
        if (!user) {
            return null;
        }

        return user;
    } catch (error) {
        console.error("Error getting user from token:", error);
        return null;
    }
} 