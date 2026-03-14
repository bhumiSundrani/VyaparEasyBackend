import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function deletePurchase(req: AuthRequest, res: Response) {
  const {id} = req.params

  if(!id || typeof id !== "string"){
    return res.status(400).json({
        success: false,
        message: "Purchase Id not found"
    })
  }
  try {
        
  
        const user = req.user as User

        const objectId = new mongoose.Types.ObjectId(id);

        const purchase = await TransactionModel.findById(objectId)
        if(!purchase){
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            })
        }
        
        const items = purchase.items

        for (const item of items) {
            const exists = await ProductModel.findById(item.productId);
            if (!exists) {
                return res.status(400).json({
                    success: false,
                    message: `Product with id ${item.productId} does not exist`
                });
            }else{
              await ProductModel.updateOne({_id: exists._id}, {currentStock: exists.currentStock - item.quantity})
            }
        }

        const party = await PartyModel.findOne({phone: purchase.supplier?.phone, user: purchase.userId})

        if(!party){
            return res.status(404).json({
                success: false,
                message: "Party doesn't exist"
            })
        }

        party.transactionId = party.transactionId.filter(
            t => t.toString() !== purchase._id.toString()
        );
        await party.save()

        await TransactionModel.deleteOne({_id: purchase._id})

                await invalidateCache(`/api/products:${user.userId}`)
                            await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)
                                    await invalidateCache(`/api/dashboard/recent-purchases:${user.userId}`)
await invalidateCache(`/api/analytics/profit-and-loss-statement:${user.userId}`)
                          await invalidateCache(`/api/analytics/profit-and-loss-trend:${user.userId}`)
                        await invalidateCache(`/api/analytics/expenses-trend:${user.userId}`)
                                                await invalidateCache(`/api/analytics/purchases-trend:${user.userId}`)

        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully"
        })
    }catch (error){
        console.error("Error deleting purchase: ", error)
        return res.status(500).json({
            success: false,
            message: "Error deleting transaction"
        })
    }

}