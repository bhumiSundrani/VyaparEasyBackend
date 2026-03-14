import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function salesTrend (req: AuthRequest, res: Response){
            const { days } = req.query;
  let day = parseInt(days as string || '7');
              

            const user = req.user as User
            
                
            try {
                const salesTrend = await TransactionModel.aggregate([
      {
        $match: {
          userId:  new mongoose.Types.ObjectId(user.userId), 
          type: "sale",
          // filter by current user
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
          totalSales: { $sum: "$totalAmount" }
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
          totalSales: 1
        }
      }
    ]);

    const responseData = {
        success: true,
        message: "Sales trend data received",
        salesTrend
    }

    await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)

    
    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching sales trend data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching sales trend data"
                    })
            }

}