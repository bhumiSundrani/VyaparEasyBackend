import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../types/User";
import { getStats } from "../controllers/dashboard/getStats";
import { lowStockAlerts } from "../controllers/dashboard/lowStockAlerts";
import { recentPurchases } from "../controllers/dashboard/recentPurchases";
import { recentSales } from "../controllers/dashboard/recentSales";
import { topCreditors } from "../controllers/dashboard/topCreditors";
import { topProducts } from "../controllers/dashboard/topProducts";

const router = Router()

router.get("/get-stats", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), getStats)

router.get("/low-stock-alerts", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), lowStockAlerts) 

router.get("/recent-purchases", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), recentPurchases)

router.get("/recent-sales", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), recentSales)

router.get("/top-creditors", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), topCreditors)

  
router.get("/top-products", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), topProducts)


export default router