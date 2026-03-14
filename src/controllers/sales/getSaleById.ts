import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function getSaleByID(req: AuthRequest, res: Response){
    try {
        const { id } = req.params
        if(!id || typeof id !== "string"){
            return res.status(400).json({
                success: false,
                message: "Sale Id not found"
            })
        }
        const objectId = new mongoose.Types.ObjectId(id);
        
      const user = req.user as User

      const sale = await TransactionModel.findById(objectId)
        // Exclude productName initially
        .select('-items.productName')
        .lean()

      if (!sale) {
        return res.status(404).json({
          success: false,
          message: "Sale not found"
        });
      }

      // Conditionally populate productName for items where it's missing
      if (sale && sale.items) {
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

      // Format the purchase data to match PurchaseFormData interface
      const formattedSale = {
        _id: sale._id.toString(),
        paymentType: sale.paymentType,
        customer: {
          name: sale.customer?.name,
          phone: sale.customer?.phone
        },
        items: sale.items.map(item => ({
          productId: item.productId.toString(),
          productName: item.productName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit
        })),
        totalAmount: sale.totalAmount,
        transactionDate: sale.transactionDate,
        dueDate: sale.dueDate,
        paid: sale.paid
      };

      return res.status(200).json({
        success: true,
        message: "Sale found successfully",
        sale: formattedSale
      })
    } catch (error) {
        console.error("Error finding sale:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error fetching sale"
        })
    }
}
