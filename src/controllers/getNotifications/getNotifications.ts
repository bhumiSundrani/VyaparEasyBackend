import { setCache } from "../../caching/setCache";
import NotificationModel from "../../models/Notification.model";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function getNotifications (req: AuthRequest, res: Response){

    
            const user = req.user as User
            

            try {
                const today = new Date();
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(today.getMonth() - 1);

                const notifications = await NotificationModel.find({
                    user: new mongoose.Types.ObjectId(user.userId),
                    isRead: false,
                    createdAt: {
                        $gte: oneMonthAgo,
                        $lte: today,
                    },
                    }).sort({ createdAt: -1 });

                    const responseData = {
                        success: true,
                        message: notifications.length > 0 ? "Notifications fetched successfully" : "No notifications found",
                        notifications
                    }

                    await setCache(`${req.originalUrl}:${user.userId}`, responseData)

                    return res.status(200).json(responseData)
            } catch (error) {
                console.log("Error fetching notifications: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching notifications"
                    })
            }

}