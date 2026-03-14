import { z } from "zod";

export const salesVerificationSchema = z.object({
    paymentType: z.enum(["cash", "credit"]),
    customer: z.object({
        name: z.string().min(1, "Supplier name is required"),
        phone: z.string().regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number")
    }),
    items: z.array(z.object({
        productId: z.string().min(1, "Product ID is required"),
        productName: z.string().min(1, "Product name is required"),
        quantity: z.number().positive("Quantity must be positive"),
        pricePerUnit: z.number().positive("Price must be positive"),
        costPrice: z.number().positive("Cost price must be positive").optional(),
    })).min(1, "At least one item is required"),
    totalAmount: z.number().positive("Total amount must be positive"),
    transactionDate: z.preprocess(
        arg => typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg, 
        z.date()
    ).optional(),
    dueDate: z.preprocess(
        arg => typeof arg === 'string' || arg instanceof Date ? new Date(arg) : arg, 
        z.date()
    ).optional(),
    paid: z.boolean().optional()
});