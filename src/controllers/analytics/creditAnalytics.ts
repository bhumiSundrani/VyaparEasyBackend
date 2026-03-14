// import { setCache } from "@/app/middlewares/cacheMiddleware";
import { Response } from "express";
import TransactionModel from "../../models/Transaction.Model";
import { User } from "../../types/User";
import { setCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import mongoose from "mongoose";

export async function creditAnalytics(req: AuthRequest, res: Response){            
            const user = req.user as User

                
            try {
               const creditAnalysis = await TransactionModel.aggregate([
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
      firstCreditDate: {$first: "$transactionDate"},
      totalOutstanding: { $sum: "$totalAmount" }
    }
  },
  {
    $sort: {
      totalOutstanding: -1
    }
  }
               ])

    const responseData = {
        success: true,
        message: "Credit analytics data received",
        creditAnalysis
    }
    
    await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)

    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching credit analytics data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching credit analytics data"
                    })
            }

}