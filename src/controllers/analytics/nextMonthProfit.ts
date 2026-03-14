import { setCache } from "../../caching/setCache"; 
import TransactionModel from "../../models/Transaction.Model";
import { subMonths, startOfMonth } from "date-fns";
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function nextMonthNetprofitForecast(req: AuthRequest, res: Response) {
  
  try {
    
            

            const user = req.user as User
        
           const sixMonthsAgo = startOfMonth(subMonths(new Date(), 6));

  const rawData = await TransactionModel.aggregate([
    {
      $match: {
        userId:  new mongoose.Types.ObjectId(user.userId),
        transactionDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $addFields: {
        year: { $year: "$transactionDate" },
        month: { $month: "$transactionDate" },
      },
    },
    {
      $facet: {
        sales: [
          { $match: { type: "sale" } },
          { $unwind: "$items" },
          {
            $group: {
              _id: { year: "$year", month: "$month" },
              revenue: { $sum: { $multiply: ["$items.pricePerUnit", "$items.quantity"] } },
              cogs: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } },
            },
          },
        ],
        purchases: [
          { $match: { type: "purchase" } },
          {
            $group: {
              _id: { year: "$year", month: "$month" },
              expenses: { $sum: "$totalAmount" },
              otherExpenses: { $sum: { $sum: "$otherExpenses.amount" } },
            },
          },
        ],
      },
    },
    {
      $project: {
        merged: {
          $concatArrays: ["$sales", "$purchases"],
        },
      },
    },
    { $unwind: "$merged" },
    {
      $group: {
        _id: "$merged._id",
        year: { $first: "$merged._id.year" },
        month: { $first: "$merged._id.month" },
        revenue: { $sum: "$merged.revenue" },
        cogs: { $sum: "$merged.cogs" },
        expenses: { $sum: { $add: ["$merged.expenses", "$merged.otherExpenses"] } },
      },
    },
    {
      $sort: { year: 1, month: 1 },
    },
  ]);

  if (rawData.length < 2) {
    return res.status(400).json({ error: "Not enough data to forecast" });
  }

  // 1️⃣ Prepare data
  const months = rawData.map((_, i) => i + 1);
  const profits = rawData.map(d => (d.revenue || 0) - (d.cogs || 0) - (d.expenses || 0));

  // 2️⃣ Train regression model
  const regression = new SimpleLinearRegression(months, profits);
  const forecastValue = regression.predict(months.length + 1);

  // 3️⃣ Format next month
  const last = rawData[rawData.length - 1];
  const nextMonthDate = new Date(last.year, last.month); // last.month is 1-indexed
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedForecast = {
    forecastedMonth: `${monthNames[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`,
    forecastedNetProfit: Math.round(forecastValue),
    pastMonths: rawData.map((d, i) => ({
      month: `${monthNames[d.month - 1]} ${d.year}`,
      netProfit: Math.round(profits[i]),
    })),
  };

  const responseData = {
    success: true,
    message: "Next Month's forecast done successfully",
    formattedForecast
  }

      await setCache(`${req.originalUrl}:${user.userId}`, responseData, 3600)
  

  return res.status(200).json(responseData)
  } catch (error) {
    console.error("Error fetching profit/loss summary:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
