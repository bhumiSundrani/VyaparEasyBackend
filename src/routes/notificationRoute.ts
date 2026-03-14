import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../types/User";
import { getNotifications } from "../controllers/getNotifications/getNotifications";

const router = Router()

router.get("/", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), getNotifications)


export default router