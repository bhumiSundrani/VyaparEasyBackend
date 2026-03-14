import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendCreditReminder } from "../controllers/sendCreditReminder.ts/sendCreditReminder";

const router = Router()

router.get("/", authMiddleware, sendCreditReminder)


export default router