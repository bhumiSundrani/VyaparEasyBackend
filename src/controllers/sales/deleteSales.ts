import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function deleteSales(req: AuthRequest, res: Response) {
  const {id} = req.params
  if(!id || typeof id !== "string") return res.status(400).json({
    success: false,
    message: "Sale ID not found"
  })

  try {
        const user = req.user as User

        const sales = await TransactionModel.findById(new mongoose.Types.ObjectId(id))
        if(!sales){
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            })
        }
        
        const items = sales.items

        for (const item of items) {
            const exists = await ProductModel.findById(item.productId);
            if (!exists) {
                return res.status(400).json({
                    success: false,
                    message: `Product with id ${item.productId} does not exist`
                });
            }else{
              await ProductModel.updateOne({_id: exists._id}, {currentStock: exists.currentStock + item.quantity})
            }
        }

        const party = await PartyModel.findOne({phone: sales.customer?.phone, user: new mongoose.Types.ObjectId(user.userId)})

        if(!party){
            return res.status(404).json({
                success: false,
                message: "Party doesn't exist"
            })
        }

        party.transactionId = party.transactionId.filter(
            t => t.toString() !== sales._id.toString()
        );

        await party.save()

        await TransactionModel.deleteOne({_id: sales._id})
        await invalidateCache(`/api/products:${user.userId}`)
                    await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)
await invalidateCache(`/api/dashboard/recent-sales:${user.userId}`)
                                                    await invalidateCache(`/api/dashboard/top-creditors:${user.userId}`)
                          await invalidateCache(`/api/dashboard/top-products:${user.userId}`)
                          await invalidateCache(`/api/analytics/credit-analytics:${user.userId}`)
                                                    await invalidateCache(`/api/analytics/profit-and-loss-statement:${user.userId}`)
                                                    await invalidateCache(`/api/analytics/profit-and-loss-trend:${user.userId}`)
                                                  await invalidateCache(`/api/analytics/sales-analytics:${user.userId}`)
                                                  await invalidateCache(`/api/analytics/sales-trend:${user.userId}`)
        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully"
        })
    }catch (error){
        console.error("Error deleting sales: ", error)
        return res.status(500).json({
            success: false,
            message: "Error deleting transaction"
        })
    }

}