import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { User } from "../../types/User";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";

export async function getAllPurchases(req: AuthRequest, res: Response){
    try {
      const user = req.user as User

      const purchases = await TransactionModel.find({userId: new mongoose.Types.ObjectId(user.userId), type: "purchase"})
        // Select all fields except for the nested item.productName which we will handle conditionally
        .select('-items.productName') // Exclude productName initially
        .sort({"transactionDate": -1})

      if(purchases.length === 0){
        return res.status(200).json({
            success: true,
            message: "No purchase found",
            purchases
        })
      }

      // Conditionally populate productName for items where it's missing
      for (const purchase of purchases) {
        for (const item of purchase.items) {
          // Check if productName is missing or null/undefined
          if (!item.productName && item.productId) {
            // Populate only this item's productId to get the name
            const product = await ProductModel.findById(item.productId).select('name').lean();
            if (product) {
              item.productName = product.name; // Assign the name to the item
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Purchases found successfully",
        purchases
      })
    } catch (error) {
        console.error("Error finding purchases:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error fetching purchases"
        })
    }
}