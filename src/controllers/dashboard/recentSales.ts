import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function recentSales (req: AuthRequest, res: Response){
    
            const user = req.user as User
            
                
            try {
               const recentSales = TransactionModel.find({
                userId: new mongoose.Types.ObjectId(user.userId),
                type: "sale"
               }).sort({ createdAt: -1 })
                .limit(5)
                .lean();  // Converts Mongoose docs into plain JS objects

                const recentSalesSerialized = (await recentSales).map(sale => ({
  ...sale,
  _id: sale._id.toString(),
}));

const responseData = {
        success: true,
        message: "Recent sales data received",
        recentSales: recentSalesSerialized
    }

    await setCache(`${req.originalUrl}:${user.userId}`, responseData);


    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching recent sales: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching recent sales"
                    })
            }

}