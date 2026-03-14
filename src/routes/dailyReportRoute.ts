import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { sendDailyReport } from "../controllers/dailyReport/sendDailyReport";

const router = Router()

router.get("/", authMiddleware, sendDailyReport)


export default router