import { Router } from "express";
import { checkPhone } from "../controllers/auth/checkPhone";
import { sendOtp } from "../controllers/auth/sendOtp"
import { verifyOtp } from "../controllers/auth/verifyOtp";
import { signUp } from "../controllers/auth/signUp";

const router = Router()

router.get("/check-phone", checkPhone)
router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)
router.post("/sign-up", signUp)

export default router