import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function topCreditors (req: AuthRequest, res: Response){
    

            const user = req.user as User
            
                
            try {
               const topCreditors = await TransactionModel.aggregate([
                {$match: {
                    userId: new mongoose.Types.ObjectId(user.userId),
                    type: "sale",
                    paymentType: "credit",
                    paid: false
                }}, 
                {
    $group: {
      _id: "$customer.phone", // or name if phone not available
      customerName: { $first: "$customer.name" },
      totalOutstanding: { $sum: "$totalAmount" },
      phone: {$first: "$customer.phone"}
    }
  },
  {
    $sort: {
      totalOutstanding: -1
    }
  },
                {$limit: 5}
               ])

               const responseData = {
        success: true,
        message: "Top creditors data received",
        topCreditors
    }

                   await setCache(`${req.originalUrl}:${user.userId}`, responseData, 1800);
               

    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching top creditors data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching top creditors data"
                    })
            }

}