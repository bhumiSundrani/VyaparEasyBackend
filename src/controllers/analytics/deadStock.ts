import { Response } from "express";
import { setCache } from "../../caching/setCache";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function deadStock (req: AuthRequest, res: Response){
    
    // Get user from token
            const user = req.user as User
                
            try {
               const products = await ProductModel.find({
                user:  new mongoose.Types.ObjectId(user.userId),
                currentStock: {$gt: 0}
               })


               const transactions = await TransactionModel.aggregate([
                {$match: {
                    userId:  new mongoose.Types.ObjectId(user.userId),
                    type: "sale"
                }}, 
                {$unwind: "$items"}, 
                {$group: {
                    _id: "$items.productId",
                    lastSold: {$max: "$transactionDate"}
                }}
               ])

               const deadStockThreshold = new Date()
               deadStockThreshold.setDate(deadStockThreshold.getDate() - 60);

               const deadStock = products.filter((product) => {
                const soldInfo = transactions.find((txn) => txn._id.toString() === product._id.toString())
                return !soldInfo || new Date(soldInfo.lastSold) < deadStockThreshold
               })

    const responseData = {
        success: true,
        message: "Dead stock data received",
        deadStock
    }
    await setCache(`${req.originalUrl}:${user.userId}`, responseData, 600)


    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching dead stock data: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching dead stock data"
                    })
            }

}