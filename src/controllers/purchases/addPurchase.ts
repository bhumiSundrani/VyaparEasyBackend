import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { purchaseVerificationSchema } from "../../schemas/purchaseVerificationSchema";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function createPurchase(req: AuthRequest, res: Response) {
    const body = req.body;
  const parsedBody = purchaseVerificationSchema.safeParse(body);
  
  if (!parsedBody.success) {
       const errors: Record<string, string> = {};

    parsedBody.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
            errors[field] = issue.message;
        } else {
            errors["_form"] = issue.message;
        }
    });
      return res.status(400).json({
          success: false,
          errors
      });
  }

  const {
      paymentType,
      supplier,
      items,
      totalAmount,
      otherExpenses,
      transactionDate
  } = parsedBody.data;

  try {
     
      const user = req.user as User

      // Validate all products exist
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

      // Convert items to proper format with ObjectIds
      const convertedItems = items.map(item => ({
          productId: new mongoose.Types.ObjectId(item.productId),
          productName: item.productName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
      }));

      // Format supplier phone with +91 prefix
      const formattedSupplier = {
          name: supplier.name,
          phone: `+91${supplier.phone}`
      };

      let dueDate: Date | undefined = undefined;
      if (paymentType === 'credit') {
          const transDate = transactionDate || new Date();
          dueDate = new Date(transDate);
          dueDate.setDate(dueDate.getDate() + 10);
      }

      const transaction = await TransactionModel.create({
          userId: new mongoose.Types.ObjectId(user.userId),
          type: 'purchase',
          paymentType,
          supplier: formattedSupplier,
          items: convertedItems,
          totalAmount,
          otherExpenses,
          transactionDate: transactionDate || new Date(),
          dueDate: dueDate,
          paid: paymentType === 'credit' ? false : true
      });

      let productSupplier = await PartyModel.findOne({ 
          phone: formattedSupplier.phone, 
          type: 'vendor', 
          user: new mongoose.Types.ObjectId(user.userId) 
      });

      if (!productSupplier) {
          productSupplier = await PartyModel.create({
              name: formattedSupplier.name,
              transactionId: [transaction._id],
              phone: formattedSupplier.phone,
              type: 'vendor',
              user: new mongoose.Types.ObjectId(user.userId)
          });
      } else {
          productSupplier.transactionId.push(transaction._id as mongoose.Types.ObjectId);
          await productSupplier.save();
      }

              await invalidateCache(`/api/products:${user.userId}`)
                    await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)
                                    await invalidateCache(`/api/dashboard/recent-purchases:${user.userId}`)

                          await invalidateCache(`/api/analytics/profit-and-loss-statement:${user.userId}`)
                          await invalidateCache(`/api/analytics/profit-and-loss-trend:${user.userId}`)
                        await invalidateCache(`/api/analytics/expenses-trend:${user.userId}`)
                                                await invalidateCache(`/api/analytics/purchases-trend:${user.userId}`)


      return res.status(201).json({
          success: true,
          message: "Purchase recorded successfully",
          transactionId: transaction._id
      });

  } catch (error) {
      console.error("Error creating purchase: ", error);
      return res.status(500).json({
          success: false,
          message: "Error creating purchase"
      });
  }
}