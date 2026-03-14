import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function getAllSales(req: AuthRequest, res: Response){
    try {
        
      const user = req.user as User
      const sales = await TransactionModel.find({userId: new mongoose.Types.ObjectId(user.userId), type: "sale"})
        // Select all fields except for the nested item.productName which we will handle conditionally
        .select('-items.productName') // Exclude productName initially
        .sort({"transactionDate": -1})

      if(sales.length === 0){
        return res.status(200).json({
            success: false,
            message: "No sale found",
            sales
        })
      }

      // Conditionally populate productName for items where it's missing
      for (const sale of sales) {
        for (const item of sale.items) {
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
        message: "Sales found successfully",
        sales
      })
    } catch (error) {
        console.error("Error finding sales:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error fetching sales"
        })
    }
}