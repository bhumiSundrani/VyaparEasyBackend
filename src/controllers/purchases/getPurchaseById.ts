import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../../types/AuthRequest";

export async function getPurchaseById(req: AuthRequest, res: Response){
    try {
      console.log("In get Purchase")
        const { id } = req.params;
        if(!id || typeof id !== "string"){
            return res.status(400).json({
                success: false,
                message: "Purchase Id not found"
            })
        }
        const objectId = new mongoose.Types.ObjectId(id);        
      
      const purchase = await TransactionModel.findById(objectId)
        // Exclude productName initially
        .select('-items.productName')
        .lean()

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: "Purchase not found"
        });
      }

      // Conditionally populate productName for items where it's missing
      if (purchase && purchase.items) {
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

      // Format the purchase data to match PurchaseFormData interface
      const formattedPurchase = {
        _id: purchase._id.toString(),
        paymentType: purchase.paymentType,
        supplier: {
          name: purchase.supplier?.name,
          phone: purchase.supplier?.phone
        },
        items: purchase.items.map(item => ({
          productId: item.productId.toString(),
          productName: item.productName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit
        })),
        totalAmount: purchase.totalAmount,
        otherExpenses: purchase.otherExpenses || [],
        transactionDate: purchase.transactionDate,
        dueDate: purchase.dueDate,
        paid: purchase.paid
      };

      return res.status(200).json({
        success: true,
        message: "Purchase found successfully",
        purchase: formattedPurchase
      })
    } catch (error) {
        console.error("Error finding purchase:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error fetching purchase"
        })
    }
}