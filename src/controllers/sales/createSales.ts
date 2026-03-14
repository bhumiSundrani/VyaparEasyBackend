import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { salesVerificationSchema } from "../../schemas/salesVerificationSchema";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function createSales(req: AuthRequest, res: Response) {
  const body = req.body;
  const parsedBody = salesVerificationSchema.safeParse(body);
  
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
      customer,
      items,
      totalAmount,
      transactionDate
  } = parsedBody.data;

  try {
    const user = req.user as User

      // Validate all products exist
      for (const item of items) {
  const product = await ProductModel.findById(item.productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: `Product with id ${item.productId} does not exist`
    });
  }

  if (product.currentStock < item.quantity) {
    return res.status(400).json({
      success: false,
      message: `Product out of stock`
    });
  }

  await ProductModel.updateOne(
    { _id: product._id },
    { $inc: { currentStock: -item.quantity } }
  );
}

      // Convert items to proper format with ObjectIds
      const convertedItems = items.map(item => ({
          productId: new mongoose.Types.ObjectId(item.productId),
          productName: item.productName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          costPrice: item.costPrice
      }));

      // Format supplier phone with +91 prefix
      const formattedCustomer = {
          name: customer.name,
          phone: `+91${customer.phone}`
      };

      
      let dueDate: Date | undefined = undefined;
      if (paymentType === 'credit') {
          const transDate = transactionDate || new Date();
          dueDate = new Date(transDate);
          dueDate.setDate(dueDate.getDate() + 10);
      }


      const transaction = await TransactionModel.create({
          userId: new mongoose.Types.ObjectId(user.userId),
          type: 'sale',
          paymentType,
          customer: formattedCustomer,
          items: convertedItems,
          totalAmount,
          transactionDate: transactionDate || new Date(),
          dueDate: dueDate,
          paid: paymentType === 'credit' ? false : true
      });

      let productCustomer = await PartyModel.findOne({ 
          phone: formattedCustomer.phone, 
          type: 'customer', 
          user: new mongoose.Types.ObjectId(user.userId) 
      });

      if (!productCustomer) {
          productCustomer = await PartyModel.create({
              name: formattedCustomer.name,
              transactionId: [transaction._id],
              phone: formattedCustomer.phone,
              type: 'customer',
              user: new mongoose.Types.ObjectId(user.userId)
          });
      } else {
          productCustomer.transactionId.push(transaction._id as mongoose.Types.ObjectId);
          await productCustomer.save();
      }
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



      return res.status(201).json({
          success: true,
          message: "Sale recorded successfully",
          transactionId: transaction._id
      });

  } catch (error) {
      console.error("Error creating sales: ", error);
      return res.status(500).json({
          success: false,
          message: "Error creating sales"
      });
  }
}