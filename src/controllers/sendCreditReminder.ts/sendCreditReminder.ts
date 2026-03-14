import { Response } from "express";
import { sendSMS } from "../../lib/sendSMS";
import NotificationModel from "../../models/Notification.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function sendCreditReminder (req: AuthRequest, res: Response){
            const {phone, amount, name} = req.query
            if(typeof phone !== "string" || typeof amount !== "string" || typeof name !== "string") return res.status(400).json({
                success: false,
                message: "Data not in string"
            })
            
            const user = req.user as User
             const message = `
Hi ${name}, your payment of ₹${amount} on purchase from ${user.shopName} is due. Please pay at your earliest convenience.`;                
            try {
               
                if (phone) {
            const res = await sendSMS(phone, message);
            if (res) {
              await NotificationModel.create({
                user: new mongoose.Types.ObjectId(user.userId),
                title: "Payment alert sent to customer",
                message: `Repayment reminder of ₹${amount} is sent to ${name} for purchase.`,
                type: "reminder",
                isRead: false,
              });
            }
          }

    return res.status(200).json({
        success: true,
        message: "Reminder sent"
    })


            } catch (error) {
                console.log("Error sending reminder: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error sending reminder"
                    })
            }

}