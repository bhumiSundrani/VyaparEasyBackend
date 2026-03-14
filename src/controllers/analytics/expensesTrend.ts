import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function expensesTrend (req: AuthRequest, res: Response){
  
    // Get user from token
             const days = Number(req.query.days) || 7;
           
            const user = req.user as User
            
                
            try {
                const otherExpensesTrend = await TransactionModel.aggregate([
  {
    $match: {
      userId: new mongoose.Types.ObjectId(user.userId),
      type: "purchase",
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - Number(days)))
      }
    }
  },
  {
    $unwind: "$otherExpenses"
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" }
      },
      totalOtherExpenses: { $sum: "$otherExpenses.amount" }
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
      totalOtherExpenses: 1
    }
  }
]);
const responseData = {
        success: true,
        message: "Expenses trend data received",
        otherExpensesTrend
    }

    await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)


    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching expenses trens ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching expenses trens"
                    })
            }

}