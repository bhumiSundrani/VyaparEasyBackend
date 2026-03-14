import { Response } from "express";
import { setCache } from "../../caching/setCache";
import { verifyToken } from "../../lib/jwtTokenManagement";
import TransactionModel from "../../models/Transaction.Model";
import { User } from "../../types/User";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";

export async function recentPurchases (req: AuthRequest, res: Response){
           
    
            const user = req.user as User
            
                
            try {
               const recentPurchases = TransactionModel.find({
                userId: new mongoose.Types.ObjectId(user.userId),
                type: "purchase"
               }).sort({ createdAt: -1 })
                .limit(5)
                .lean(); 

                const recentPurchaseSerialized = (await recentPurchases).map(purchase => ({
  ...purchase,
  _id: purchase._id.toString(),
}));

const responseData = {
        success: true,
        message: "Recent purchases data received",
        recentPurchases: recentPurchaseSerialized
    }

    await setCache(`${req.originalUrl}:${user.userId}`, responseData);



    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching recent purchases: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching recent purchases"
                    })
            }

}