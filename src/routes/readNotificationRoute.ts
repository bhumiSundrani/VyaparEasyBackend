import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { readNotification } from "../controllers/readNotifications/readNotificationByID";
import { readAllNotifications } from "../controllers/readNotifications/readAllNotifications";

const router = Router()

router.patch("/", authMiddleware, readAllNotifications)

router.patch("/:id", authMiddleware, readNotification)


export default router