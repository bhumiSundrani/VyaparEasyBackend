import TransactionModel from "../../models/Transaction.Model";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function updatePaymentSale(req: AuthRequest, res: Response){
  try {
        const { id } = req.params;
        if(!id || typeof id !== "string"){
            return res.status(400).json({
                success: false,
                message: "Sale ID not found"
            })
        }
        const objectId = new mongoose.Types.ObjectId(id);      
        
      const user = req.user as User

     const sale = await TransactionModel.findById(objectId);

if (!sale) {
  return res.status(404).json({
    success: false,
    message: "Sale not found"
  });
}

sale.paid = !sale.paid;

await sale.save();

      

      // Format the purchase data to match PurchaseFormData interface
    
      return res.status(200).json({
        success: true,
        message: "Sale updated successfully",
        sale
      })
    } catch (error) {
        console.error("Error updating sale:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Error updating purchase"
        })
    }
}