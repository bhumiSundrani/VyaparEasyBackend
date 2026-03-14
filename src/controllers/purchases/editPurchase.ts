import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { purchaseVerificationSchema } from "../../schemas/purchaseVerificationSchema";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function editPurchase(req: AuthRequest, res: Response) {
  const body = req.body;
  const {id} = req.params

  if(!id || typeof id !== "string"){
    return res.status(400).json({
        success: false,
        message: "Purchase Id not found"
    })
  }

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
      return res.status(400).json({ success: false, errors});
  }

  const {
      paymentType,
      supplier,
      items,
      totalAmount,
      otherExpenses,
      transactionDate,
  } = parsedBody.data;

  try {
      
      const user = req.user as User
      if (!user) {
          return res.status(401).json({ success: false, message: "User not found" });
      }

      const transaction = await TransactionModel.findOne({ _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(user.userId) });
      if (!transaction) {
          return res.status(400).json({ success: false, message: "Transaction not found" });
      }

      // Store original items for stock adjustment
      const originalItems = transaction.items;

      // Validate all products exist and prepare stock changes
      const stockChanges: Map<string, number> = new Map();
      
      for (const item of items) {
          const product = await ProductModel.findById(item.productId);
          if (!product) {
              return res.status(400).json({
                  success: false,
                  message: `Product with id ${item.productId} does not exist`
              });
          }
          
          // Find original quantity for this product
          const originalItem = originalItems.find(orig => 
              orig.productId.toString() === item.productId.toString()
          );
          const originalQuantity = originalItem ? originalItem.quantity : 0;
          
          // Calculate stock change (new quantity - old quantity)
          const stockChange = item.quantity - originalQuantity;
          
          if (stockChange !== 0) {
              // Check if we have enough stock for reduction
              if (stockChange < 0 && product.currentStock < Math.abs(stockChange)) {
                  return res.status(400).json({
                      success: false,
                      message: `Insufficient stock for product ${product.name}. Available: ${product.currentStock}, Required: ${Math.abs(stockChange)}`
                  });
              }
              
              stockChanges.set(item.productId.toString(), stockChange);
          }
      }

      // Handle removed products (products that were in original but not in new items)
      for (const originalItem of originalItems) {
          const stillExists = items.find(item => 
              item.productId.toString() === originalItem.productId.toString()
          );
          
          if (!stillExists) {
              // Product was removed, reduce stock by original quantity
              const stockChange = -originalItem.quantity;
              stockChanges.set(originalItem.productId.toString(), stockChange);
          }
      }

      // Store original values before updating
      const originalSupplierPhone = transaction.supplier?.phone;

      // Convert items to proper format
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

      // Calculate due date if payment type is credit
      let dueDate: Date | undefined = undefined;
      if (paymentType === "credit") {
          const transDate = transactionDate || new Date();
          dueDate = new Date(transDate);
          dueDate.setDate(dueDate.getDate() + 10);
      }

      // Update transaction
      transaction.paymentType = paymentType;
      transaction.supplier = formattedSupplier;
      transaction.items = convertedItems;
      transaction.totalAmount = totalAmount;
      transaction.otherExpenses = otherExpenses;
      transaction.dueDate = dueDate;
      transaction.paid = paymentType === 'credit' ? false : true
      if (transactionDate !== undefined) {
          transaction.transactionDate = transactionDate;
      }
      await transaction.save();

      // Update product stocks
      for (const [productId, stockChange] of stockChanges) {
          await ProductModel.findByIdAndUpdate(
              productId,
              { $inc: { currentStock: stockChange } },
              { new: true }
          );
      }

      // Handle party updates
      let party = await PartyModel.findOne({ 
          phone: formattedSupplier.phone, 
          type: "vendor", 
          user: new mongoose.Types.ObjectId(user.userId)
      });

      if (!party) {
          // Create new party
          party = await PartyModel.create({
              name: formattedSupplier.name,
              transactionId: [transaction._id],
              phone: formattedSupplier.phone,
              type: "vendor",
              user: new mongoose.Types.ObjectId(user.userId),
          });
      } else {
          // Update existing party
          if (!party.transactionId.includes(transaction._id as mongoose.Types.ObjectId)) {
              party.transactionId.push(transaction._id as mongoose.Types.ObjectId);
          }


          await party.save();
      }

      // Clean up old party if supplier changed
      if (originalSupplierPhone && originalSupplierPhone !== formattedSupplier.phone) {
          const oldParty = await PartyModel.findOne({
              phone: originalSupplierPhone,
              type: "vendor",
              user: new mongoose.Types.ObjectId(user.userId)
          });

          if (oldParty) {
              // Remove transaction from old party
              oldParty.transactionId = oldParty.transactionId.filter(
                  id => !id.equals(transaction._id as mongoose.Types.ObjectId)
              );

              // Delete party if no transactions left
              if (oldParty.transactionId.length === 0) {
                  await PartyModel.deleteOne({ _id: oldParty._id });
              } else {
                  await oldParty.save();
              }
          }
      }

              await invalidateCache(`/api/products:${user.userId}`)
                          await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)
                                    await invalidateCache(`/api/dashboard/recent-purchases:${user.userId}`)
await invalidateCache(`/api/analytics/profit-and-loss-statement:${user.userId}`)
                          await invalidateCache(`/api/analytics/profit-and-loss-trend:${user.userId}`)
                        await invalidateCache(`/api/analytics/expenses-trend:${user.userId}`)
                                                await invalidateCache(`/api/analytics/purchases-trend:${user.userId}`)

      return res.status(200).json({
          success: true,
          message: "Purchase updated successfully",
          transactionId: transaction._id,
      });

  } catch (error) {
      console.error("Error editing purchase: ", error);
      return res.status(500).json({
          success: false,
          message: "Failed to edit purchase",
      });
  }
}