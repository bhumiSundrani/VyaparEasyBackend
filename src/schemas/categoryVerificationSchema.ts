import { z } from "zod";

export const objectIdSchema=  z.string().length(24, "Invalid ObjectId length")

export const categoryVerificationSchema = z.object({
    name: z.string().nonempty("Required"),
    parentCategory: z.string().optional().nullable().transform(val => val === "none" ? null : val)
})