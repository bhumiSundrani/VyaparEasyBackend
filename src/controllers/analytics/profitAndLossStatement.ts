import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function profitAndLossStatement(req: AuthRequest, res: Response) {
  
  const { from, to } = req.query

  try {
    // 1. Authenticate
               const user = req.user as User


    let fromParam =
  typeof from === "string" ? new Date(from) : null;

let toParam =
  typeof to === "string" ? new Date(to) : null;


    const today = new Date();

    if (!to) {
            toParam = new Date(today);
            }

            if (!from) {
            fromParam = new Date(today); // base it on `to`
            
            }

            
            toParam?.setHours(23, 59, 59, 999); // End of today
            fromParam?.setHours(0, 0, 0, 0); // Start of day

    const matchRange = {
      userId:  new mongoose.Types.ObjectId(user.userId),
      createdAt: { $gte: from, $lte: to },
    };

    // 3. Revenue & COGS
    const salesAgg = await TransactionModel.aggregate([
      { $match: { ...matchRange, type: "sale" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          cogs: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } }
        }
      }
    ]);

    const revenue = salesAgg[0]?.revenue || 0;
    const cogs = salesAgg[0]?.cogs || 0;

    // 4. Expenses
    const expensesAgg = await TransactionModel.aggregate([
      { $match: { ...matchRange, type: "purchase" } },
      {$unwind: "$otherExpenses"},
      {
        $group: {
          _id: null,
          expenses: { $sum: "$otherExpenses.amount" }
        }
      }
    ]);

    const expenses = expensesAgg[0]?.expenses || 0;
    const netProfit = revenue - cogs - expenses;

    const responseData = {
      success: true,
      message: "Profit and Loss statement sent successfully",
      from,
      to,
      summary: {
        revenue,
        cogs,
        expenses,
        netProfit
      }
    }

          await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)
    

    // 5. Response
    return res.status(200).json(responseData);

  } catch (error) {
    console.error("Error fetching profit/loss summary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
