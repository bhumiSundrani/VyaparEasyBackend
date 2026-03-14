import { generateOtp } from "../../lib/generateOtp"; 
import { sendOTP } from "../../lib/sendOTP";
import OtpVerificationModel from "../../models/OtpVerification.model";
import { phoneSchema } from "../../schemas/phoneSchema";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";

export async function sendOtp(req: AuthRequest, res: Response){
    try {
        const body = req.body;
        const parsed = phoneSchema.safeParse(body);
        if(!parsed.success){
            console.log("Error parsing data: ", parsed.error.issues)
            return res.status(400).json({
                success: false,
                message: "Invalid Input"
            })
        }
        const {phone} = parsed.data;

        const otp = generateOtp();
        const response = await sendOTP({phone, otp})
        if (response?.return !== true) {
            console.log("Error sending otp: ", response)
            return res.status(500).json({
                success: false,
                message: "Error sending otp"
            });
        }
        const now = new Date()
        await OtpVerificationModel.findOneAndUpdate(
            {phone: `+91${phone}`},
            {
                phone: `+91${phone}`,
                otp,
                expiresAt: new Date(now.getTime()+5*60*1000),
                isVerified: false
            },
            {upsert: true, new: true}
        )

        return res.status(200).json({
            success: true,
            message: "Otp sent successfully"
        })
    } catch (error: any) {
        console.log("Error sending otp: ", error)
            return res.status(500).json({
                success: false,
                message: error.message || "Error sending otp"
            })
    }
}