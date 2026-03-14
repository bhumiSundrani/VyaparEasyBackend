import { Response } from "express";
import { generateToken } from "../../lib/jwtTokenManagement";
import OtpVerificationModel from "../../models/OtpVerification.model";
import UserModel from "../../models/User.model";
import { verificationSchema } from "../../schemas/verifySchema";
import { AuthRequest } from "../../types/AuthRequest";
import mongoose from "mongoose";

export async function verifyOtp(req: AuthRequest, res: Response) {

    try {
        const body = req.body
        const parsed = verificationSchema.safeParse(body);

        if (!parsed.success) {
            console.log(parsed.error.issues);
            return res.status(400).json({
                success: false,
                message: "Invalid input"
            });
        }

        const { phone, otp } = parsed.data;
        const record = await OtpVerificationModel.findOne({ phone: `+91${phone}` });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "OTP record not found. Please request a new OTP."
            });
        }

        if (record.isVerified) {
            return res.status(400).json({
                success: false,
                message: "OTP already used"
            });
        }

        if (record && record.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP Expired. Please try again!"
            });
        }

        if (record && otp !== record.otp) {
            return res.status(400).json({
                success: false,
                message: "Wrong OTP"
            });
        }

        record.isVerified = true;
        await record.save();

        // Find existing user in user database
        const existingUser = await UserModel.findOne({ phone: `+91${phone}` });

        if (existingUser) {
            const token = await generateToken({
                userId: existingUser._id.toString(),
                phone: `+91${phone}`,
                name: existingUser.name,
                shopName: existingUser.shopName,
                preferredLanguage: existingUser.preferredLanguage
            });

            if (!token) {
                return res.status(500).json({
                    success: false,
                    message: "Error generating token"
                });
            }

            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "none",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                success: true,
                message: "OTP verified",
                user: existingUser
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified",
        });

    } catch (error) {
        console.error("Error verifying OTP: ", error);
        return res.status(500).json({
            success: false,
            message: "Error verifying OTP"
        });
    }
}
