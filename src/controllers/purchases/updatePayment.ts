import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { User } from "../../types/User";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";

export async function updatePayment(req: AuthRequest, res: Response){
  try {
        const { id } = req.params;
        if(!id || typeof id !== "string"){
            return res.status(400).json({
                success: false,
                message: "Purchase Id not found"
            })
        }
        const objectId = new mongoose.Types.ObjectId(id);
        
      const user = req.user as User

      const purchase = await TransactionModel.findById(objectId);

if (!purchase) {
  return res.status(404).json({
    success: false,
    message: "Purchase not found"
  });
}

purchase.paid = !purchase.paid;
await purchase.save();

      await invalidateCache(`/api/products:${user.userId}`)
                    await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)
                                    await invalidateCache(`/api/dashboard/recent-purchases:${user.userId}`)

                          await invalidateCache(`/api/analytics/profit-and-loss-statement:${user.userId}`)
                          await invalidateCache(`/api/analytics/profit-and-loss-trend:${user.userId}`)
                        await invalidateCache(`/api/analytics/expenses-trend:${user.userId}`)
                                                await invalidateCache(`/api/analytics/purchases-trend:${user.userId}`)


      // Format the purchase data to match PurchaseFormData interface
    
      return res.status(200).json({
        success: true,
        message: "Purchase updated successfully",
        purchase
      })
    } catch (error) {
        console.error("Error updating purchase:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error updating purchase"
        })
    }
}