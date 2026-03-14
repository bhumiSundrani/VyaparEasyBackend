import {z} from 'zod'

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be atleast 2 characters"),
    shopName: z.string().min(1, "Shop name cannot be empty"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number"),
    preferredLanguage: z.string().nonempty("Preferred language is required")
})