import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function topProducts (req: AuthRequest, res: Response){
    

            const user = req.user as User
            
                
            try {
               const topProducts = await TransactionModel.aggregate([
                {$match: {
                    userId: new mongoose.Types.ObjectId(user.userId),
                    type: "sale"
                }}, 
                {$unwind: "$items"},
                {$group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    totalUnitsSold: { $sum: "$items.quantity" },
                    totalSalesValue: { $sum: { $multiply: ["$items.quantity", "$items.pricePerUnit"] } }
                }},{
                    $sort: {totalUnitsSold: -1}
                },
                {$limit: 5}
               ])

               const responseData = {
        success: true,
        message: "Top products data received",
        topProducts
    }

                                  await setCache(`${req.originalUrl}:${user.userId}`, responseData, 3600);
               

    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching top products data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching top products data"
                    })
            }

}