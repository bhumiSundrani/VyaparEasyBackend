import {z} from 'zod'

export const phoneSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number")
  })
  