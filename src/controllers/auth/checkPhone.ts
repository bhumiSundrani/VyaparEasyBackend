import { phoneSchema } from "../../schemas/phoneSchema";
import { Response } from "express";
import { AuthRequest } from "../../types/AuthRequest";

export async function checkPhone(req: AuthRequest, res: Response){
    try {
        const phone = req.query.phone

        const queryParam = {
            phone: typeof phone === "string" ? phone : ""
        }
        const result = phoneSchema.safeParse(queryParam)
        if(!result.success){
            const phoneError = result.error.format().phone?._errors || []
            return res.status(400).json({
                success: false,
                message: phoneError?.length > 0 ? phoneError.join(", ") : "Invalid query parameters"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Phone number is valid"
        })
    } catch (error) {
        console.log("Error checking phone number: ", error)
        return res.status(500).json({
            success: false,
            message: "Error checking username"
        })
    }
}