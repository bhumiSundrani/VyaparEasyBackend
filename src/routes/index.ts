import { Router } from "express";
import authRouter from "./authRoute"
import userRouter from "./userRoute"
import analyticsRouter from "./analyticsRoute"
import categoryRouter from "./categoryRoute"
import cronRouter from "./cronRoute"
import dailyReportRoute from "./dailyReportRoute"
import dashboardRoute from "./dashboardRoute"
import notificationRoute from "./notificationRoute"
import partiesRoute from "./parties"
import readNotificationRoute from "./readNotificationRoute"
import sendCreditReminderRoute from "./sendCreditReminderRoute"
import productRoute from "./productRoute"
import purchaseRoute from "./purchaseRoute"
import saleRoute from "./salesRoute"

const router = Router()

router.use("/auth", authRouter)
router.use("/user", userRouter)
router.use("/analytics", analyticsRouter)
router.use("/categories", categoryRouter)
router.use("/cron-jobs", cronRouter)
router.use("/daily-report", dailyReportRoute)
router.use("/dashboard", dashboardRoute)
router.use("/get-notifications", notificationRoute)
router.use("/parties", partiesRoute)
router.use("/read-notifications", readNotificationRoute)
router.use("/send-credit-reminder", sendCreditReminderRoute)
router.use("/products", productRoute)
router.use("/purchases", purchaseRoute)
router.use("/sales", saleRoute)

export default router