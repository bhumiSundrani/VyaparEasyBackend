import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";
import NotificationModel from "../../models/Notification.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function readNotification(
    req: AuthRequest,
    res: Response
) {
         
    try {
        // Add defensive check for params
        const {id} = req.params
        if (!id || typeof id !== "string") {
            return res.status(400).json({
                success: false,
                message: "Missing parameters"
            });
        }
        

        const user = req.user as User

        // Update notification
        await NotificationModel.findByIdAndUpdate(new mongoose.Types.ObjectId(id), {
            isRead: true
        });


        await invalidateCache(`/api/get-notifications:${user.userId}`)
        
        return res.status(200).json({
            success: true,
            message: "Notification marked as read"
        });

    } catch (error) {
        console.log("Cannot mark notification as read: ", error);
        return res.status(500).json({
            success: false,
            message: "Error marking notification as read"
        });
    }
}