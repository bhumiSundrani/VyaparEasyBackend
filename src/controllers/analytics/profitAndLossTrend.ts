import { Response } from "express";
import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function profitAndLossTrend(req: AuthRequest, res: Response) {
  const view = req.query.view || "yearly"
  const year = req.query.year
  try {
    // 1. Authenticate user
                const user = req.user as User
    // 2. Extract query params

    let groupFields: any;
    let labelFormatter: (id: any) => string;
    const matchBase: any = { userId: new mongoose.Types.ObjectId(user.userId) };

    // 3. Grouping logic based on view
    if (view === "yearly") {
      groupFields = { year: { $year: "$createdAt" } };
      labelFormatter = (id) => `${id.year}`;
    } else if (view === "monthly") {
      const yearParsed = parseInt(year as string || `${new Date().getFullYear()}`);
      matchBase.createdAt = {
        $gte: new Date(yearParsed, 0, 1),
        $lte: new Date(yearParsed, 11, 31, 23, 59, 59, 999),
      };
      groupFields = { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } };
      labelFormatter = (id) => `${id.month.toString().padStart(2, "0")}/${id.year}`;
    } else if (view === "daily") {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 6);
      fromDate.setHours(0, 0, 0, 0);
      matchBase.createdAt = { $gte: fromDate, $lte: today };

      groupFields = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
        day: { $dayOfMonth: "$createdAt" },
      };
      labelFormatter = (id) => {
        const date = new Date(id.year, id.month - 1, id.day);
        return date.toISOString().split("T")[0];
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid view" });
    }

    // 4. Sales Aggregation
    const salesAgg = await TransactionModel.aggregate([
      { $match: { ...matchBase, type: "sale" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: groupFields,
          revenue: { $sum: "$totalAmount" },
          cogs: { $sum: { $multiply: ["$items.costPrice", "$items.quantity"] } },
        },
      },
    ]);

    // 5. Expense Aggregation
    const expensesAgg = await TransactionModel.aggregate([
      { $match: { ...matchBase, type: "purchase" } },
      {$unwind: "$otherExpenses"},
      {
        $group: {
          _id: groupFields,
          expenses: { $sum: "$otherExpenses.amount" },
        },
      },
    ]);

    // 6. Merge & compute net profits
    const dataMap = new Map<string, { revenue: number; cogs: number; expenses: number }>();

    for (const s of salesAgg) {
      const label = labelFormatter(s._id);
      const existing = dataMap.get(label) || { revenue: 0, cogs: 0, expenses: 0 };
      dataMap.set(label, { ...existing, revenue: s.revenue, cogs: s.cogs });
    }

    for (const e of expensesAgg) {
      const label = labelFormatter(e._id);
      const existing = dataMap.get(label) || { revenue: 0, cogs: 0, expenses: 0 };
      dataMap.set(label, { ...existing, expenses: e.expenses });
    }

    // 7. Prepare response
    const labels = [...dataMap.keys()].sort();
    const netProfits = labels.map((label) => {
      const { revenue, cogs, expenses } = dataMap.get(label)!;
      return revenue - cogs - expenses;
    });

    const responseData = {
      success: true,
      message: "Profit/Loss data sent successfully",
      view,
      labels,
      netProfits,
    }

    await setCache(`${req.path}:${user.userId}`, responseData, 300)
    

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching profit/loss data:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
