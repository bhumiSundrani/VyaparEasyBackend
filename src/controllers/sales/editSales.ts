import { invalidateCache } from "../../caching/setCache";
import PartyModel from "../../models/Party.model";
import ProductModel from "../../models/Product.model";
import TransactionModel from "../../models/Transaction.Model";
import { salesVerificationSchema } from "../../schemas/salesVerificationSchema";
import mongoose from "mongoose";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function editSales(req: AuthRequest, res: Response) {
    const body = req.body;
    const { id } = req.params;
    if(!id || typeof id !== "string") return res.status(400).json({
        success: false,
        message: "Sale ID not found"
    })
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
        return res.status(400).json({ success: false, errors });
    }

    const {
        paymentType,
        customer, // Changed from 'supplier' to 'customer'
        items,
        totalAmount, 
        transactionDate,
    } = parsedBody.data;

    try {
        
        const user = req.user as User

        // Find the sales transaction (not purchase)
        const transaction = await TransactionModel.findOne({ 
            _id: new mongoose.Types.ObjectId(id), 
            userId: new mongoose.Types.ObjectId(user.userId),
            type: "sale" // Make sure we're editing a sales transaction
        });
        
        if (!transaction) {
            return res.status(404).json({ 
                success: false, 
                message: "Sales transaction not found" 
            });
        }

        // Store original items for stock adjustment
        const originalItems = transaction.items;

        // Validate all products exist and prepare stock changes
        const stockChanges: Map<string, number> = new Map();
        
        for (const item of items) {
            const product = await ProductModel.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with id ${item.productId} does not exist`
                });
            }
            
            // Find original quantity for this product
            const originalItem = originalItems.find(orig => 
                orig.productId.toString() === item.productId.toString()
            );
            const originalQuantity = originalItem ? originalItem.quantity : 0;
            
            // Calculate stock change for SALES (opposite of purchase logic)
            // Original sale reduced stock by originalQuantity
            // New sale should reduce stock by item.quantity
            // So net change = originalQuantity - item.quantity
            const stockChange = originalQuantity - item.quantity;
            
            if (stockChange !== 0) {
                // For sales: if stockChange is negative, we're selling more (reducing stock more)
                // Check if we have enough stock for additional sale
                if (stockChange < 0 && product.currentStock < Math.abs(stockChange)) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for product ${product.name}. Available: ${product.currentStock}, Additional required: ${Math.abs(stockChange)}`
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
                // Product was removed from sale, restore stock by original quantity
                const stockChange = originalItem.quantity;
                stockChanges.set(originalItem.productId.toString(), stockChange);
            }
        }

        // Store original values before updating
        const originalCustomerPhone = transaction.customer?.phone;

        // Convert items to proper format
        const convertedItems = items.map(item => ({
            productId: new mongoose.Types.ObjectId(item.productId),
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
        }));

        // Format customer phone with +91 prefix
        const formattedCustomer = {
            name: customer.name,
            phone: `+91${customer.phone}`
        };

        // Calculate due date if payment type is credit
        let dueDate: Date | undefined = undefined;
        if (paymentType === "credit") {
            const transDate = transactionDate || new Date();
            dueDate = new Date(transDate);
            dueDate.setDate(dueDate.getDate() + 30); // 30 days for customer credit (vs 10 for supplier)
        }

        // Update transaction
        transaction.paymentType = paymentType;
        transaction.customer = formattedCustomer; // Changed from 'supplier'
        transaction.items = convertedItems;
        transaction.totalAmount = totalAmount;
        transaction.dueDate = dueDate;
        transaction.paid = paymentType === 'credit' ? false : true;
        if (transactionDate !== undefined) {
            transaction.transactionDate = transactionDate;
        }
        await transaction.save();

        // Update product stocks
        for (const [productId, stockChange] of stockChanges) {
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                productId,
                { $inc: { currentStock: stockChange } },
                { new: true }
            );
            
            console.log(`Updated stock for product ${productId}: change ${stockChange}, new stock: ${updatedProduct?.currentStock}`);
        }

        // Handle party updates (customer instead of vendor)
        let party = await PartyModel.findOne({ 
            phone: formattedCustomer.phone, 
            type: "customer", // Changed from "vendor"
            user:  new mongoose.Types.ObjectId(user.userId) 
        });

        if (!party) {
            // Create new customer party
            party = await PartyModel.create({
                name: formattedCustomer.name,
                transactionId: [transaction._id],
                phone: formattedCustomer.phone,
                type: "customer", // Changed from "vendor"
                user: new mongoose.Types.ObjectId(user.userId),
            });
        } else {
            // Update existing customer party
            if (!party.transactionId.includes(transaction._id as mongoose.Types.ObjectId)) {
                party.transactionId.push(transaction._id as mongoose.Types.ObjectId);
            }

            await party.save();
        }

        // Clean up old party if customer changed
        if (originalCustomerPhone && originalCustomerPhone !== formattedCustomer.phone) {
            const oldParty = await PartyModel.findOne({
                phone: originalCustomerPhone,
                type: "customer", // Changed from "vendor"
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
            message: "Sale updated successfully",
            transactionId: transaction._id,
        });

    } catch (error) {
        console.error("Error editing sale: ", error);
        return res.status(500).json({
            success: false,
            message: "Failed to edit sale",
        });
    }
}