import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getUser } from "../controllers/user/getUser";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { AuthRequest } from "../types/AuthRequest";
import { User } from "../types/User";
import { logout } from "../controllers/user/logout";

const router = Router()

router.get("/get-user", authMiddleware, cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), getUser)

router.post("/logout", authMiddleware, logout)

export default router