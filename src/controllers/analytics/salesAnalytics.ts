import { setCache } from "../../caching/setCache";
import TransactionModel from "../../models/Transaction.Model";
import { User } from "../../types/User";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import mongoose from "mongoose";

export async function salesAnalytics (req: AuthRequest, res: Response){
  
    // Get user from token
           

            const user = req.user as User
            
            const { from, to, customer, product, paymentType } = req.query;
            let fromParam = typeof from === "string" ? new Date(from) : null
            let toParam = typeof to === "string" ? new Date(to) : null
            const today = new Date();

            if (!toParam) {
            toParam = new Date(today);
            }

            if (!fromParam) {
            fromParam = new Date(toParam); // base it on `to`
            fromParam.setDate(toParam.getDate() - 6); // Last 7 days = today + 6 before
            }

             toParam.setHours(23, 59, 59, 999); // End of today
            fromParam.setHours(0, 0, 0, 0); // Start of day

            const query : any = {
                userId:  new mongoose.Types.ObjectId(user.userId),
                type: "sale",
                createdAt: {$gte: from, $lte: to}
            }

            if(customer){
                query["customer.name"] = { $regex: customer, $options: "i" };
            }

            if(paymentType){
                query["paymentType"] = paymentType
            }

            if (product) {
                query["items.productName"] = { $regex: product, $options: "i" }; // case-insensitive match
            }

                
            try {
                const totalSales = await TransactionModel.aggregate([
                { $match: query },
                { $unwind: "$items" },
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
                    message: "Sales analytics sent successfully: ",
                    totalSales
                }

            await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)
    

                return res.status(200).json(responseData)
            } catch (error) {
                console.log("Error fetching sales analytics data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching sales analytics data"
                    })
            }

}