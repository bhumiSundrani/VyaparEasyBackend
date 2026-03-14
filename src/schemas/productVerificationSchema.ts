import { z } from "zod";
import { objectIdSchema } from "./categoryVerificationSchema"

export const productVerificationSchema = z.object({
    _id: z.string().nullable().optional(),
    name: z.string().nonempty("Add product name"),
    brand: z.string().nullable().optional(),
    category: objectIdSchema.nonempty("Select one"),
    unit: z.enum(["kg", "gm", "liter", "ml", "pcs"]),
    costPrice: z.number().min(0, "Cost price must be a positive value"),
    sellingPrice: z.number().min(0, "Selling price must be a positive value"),
    lowStockThreshold: z.number().min(0, "Low stock threshold must be a positive value"),
    currentStock: z.number().min(0, "Current stock must be a positive value"),
})