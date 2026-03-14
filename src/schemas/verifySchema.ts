import {z} from 'zod'

export const verificationSchema = z.object({
    phone:  z.string().regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number"),
    otp: z.string().length(6, "OTP should be 6 digits").regex(/^\d{6}$/, "OTP must be a 6-digit number.")
})