import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";
import NotificationModel from "../../models/Notification.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function readAllNotifications(req: AuthRequest, res: Response) {
       
            const user = req.user as User
            try {
                await NotificationModel.updateMany({
                    user: new mongoose.Types.ObjectId(user.userId),
                    isRead: false,
                }, {
                    isRead: true
                })
                await invalidateCache(`/api/get-notifications:${user.userId}`)
                
                return res.status(200).json({
                    success: true,
                    message: "All notifications marked as read"
                })
            } catch (error) {
                console.log("Cannot mark notifications as read: ", error)
                return res.status(500).json({
                    success: false,
                    message: "Error marking notifications as read"
                })
            }
}