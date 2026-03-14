import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function purchasesTrend (req: AuthRequest, res: Response){
            let { days } = req.query
            const day = parseInt(days as string || '7');
            
            const user = req.user as User
            
                
            try {
                const purchaseTrend = await TransactionModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.userId), // filter by current user,
          type: "purchase",
          createdAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - Number(day)))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalPurchases: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          },
          totalPurchases: 1
        }
      }
    ]);

    const responseData = {
        success: true,
        message: "Purchases trend data received",
        purchaseTrend
    }

        await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)
    

    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching purchase trend: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching purchase trend"
                    })
            }

}