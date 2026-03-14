import mongoose from "mongoose";
import { setCache } from "../../caching/setCache";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import { Response } from "express";

export async function getStats (req: AuthRequest, res: Response){
        

            const user = req.user as User
            
                
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                const todaySales = await TransactionModel.aggregate([
                    {$match: {
                        userId: new mongoose.Types.ObjectId(user.userId),
                        type: "sale",
                        transactionDate: {$gte: today, $lte: tomorrow}
                    }}, {
                        $group: {
                            _id: null,
                            totalSaleAmount: {$sum: "$totalAmount"}
                        }
                    }
                ])

                const todayPurchases = await TransactionModel.aggregate([
                    {$match: {
                        userId: new mongoose.Types.ObjectId(user.userId),
                        type: "purchase",
                        transactionDate: {$gte: today, $lte: tomorrow}
                    }}, {
                        $group: {
                            _id: null,
                            totalPurchaseAmount: {$sum: "$totalAmount"}
                        }
                    }
                ])

                const totalCreditSales = await TransactionModel.aggregate([
                    {$match: {
                        userId: new mongoose.Types.ObjectId(user.userId),
                        type: "sale",
                        paymentType: "credit",
                        transactionDate: {$gte: today, $lte: tomorrow}
                    }}, {
                        $group: {
                            _id: null,
                            totalCreditSaleAmount: {$sum: "$totalAmount"}
                        }
                    }
                ])
                
                const totalOutstandingCredit = await TransactionModel.aggregate([
                    {$match: {
                        userId: new mongoose.Types.ObjectId(user.userId),
                        type: "purchase",
                        paymentType: "credit",
                        transactionDate: {$gte: today, $lte: tomorrow}
                    }}, {
                        $group: {
                            _id: null,
                            totalOutstandingCreditAmount: {$sum: "$totalAmount"}
                        }
                    }
                ])

                const totalCashReceived = await TransactionModel.aggregate([
                    {$match: {
                        userId: new mongoose.Types.ObjectId(user.userId),
                        type: "sale",
                        paymentType: "cash",
                        transactionDate: {$gte: today, $lte: tomorrow}
                    }}, {
                        $group: {
                            _id: null,
                            totalCashReceivedAmount: {$sum: "$totalAmount"}
                        }
                    }
                ])

                const totalInventory = await ProductModel.aggregate([
  {
    $match: {
      user: new mongoose.Types.ObjectId(user.userId),
      currentStock: { $gt: 0 }
    }
  },
  {
    $project: {
      inventoryValue: { $multiply: ["$costPrice", "$currentStock"] }
    }
  },
  {
    $group: {
      _id: null,
      totalInventoryAmount: { $sum: "$inventoryValue" }
    }
  },
  {
    $project: {
      _id: 0,
      totalInventoryAmount: 1
    }
  }
]);

const responseData = {
                    success: true,
                    message: "Stats received successfully",
                    stats: {
                        sales: todaySales[0]?.totalSaleAmount || 0,
                        purchases: todayPurchases[0]?.totalPurchaseAmount || 0,
                        creditSales: totalCreditSales[0]?.totalCreditSaleAmount || 0,
                        outstandingCredit: totalOutstandingCredit[0]?.totalOutstandingCreditAmount || 0,
                        cashReceived: totalCashReceived[0]?.totalCashReceivedAmount || 0,
                        inventoryAmount: totalInventory[0]?.totalInventoryAmount || 0
                    }
                }

await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300)

                return res.status(200).json(responseData)

            } catch (error) {
                console.log("Error fetching dashboard stats: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching dashboard stats"
                    })
            }

}