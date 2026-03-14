import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../types/User";
import { creditAnalytics } from "../controllers/analytics/creditAnalytics";
import { deadStock } from "../controllers/analytics/deadStock";
import { expensesTrend } from "../controllers/analytics/expensesTrend";
import { nextMonthNetprofitForecast } from "../controllers/analytics/nextMonthProfit";
import { profitAndLossStatement } from "../controllers/analytics/profitAndLossStatement";
import { profitAndLossTrend } from "../controllers/analytics/profitAndLossTrend";
import { purchasesTrend } from "../controllers/analytics/purchasesTrend";
import { salesAnalytics } from "../controllers/analytics/salesAnalytics";
import { salesTrend } from "../controllers/analytics/salesTrend";

const router = Router()

router.get("/credit-analytics", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), creditAnalytics)

router.get("/dead-stock", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), deadStock) 

router.get("/expenses-trend", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), expensesTrend)

router.get("/next-month-netprofit-forecast", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), nextMonthNetprofitForecast)

router.get("/profit-and-loss-statement", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), profitAndLossStatement)

router.get("/profit-and-loss-trend", authMiddleware, profitAndLossTrend)
  
router.get("/purchases-trend", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), purchasesTrend)


router.get("/sales-analytics", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), salesAnalytics)


router.get("/sales-trend", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), salesTrend)

export default router