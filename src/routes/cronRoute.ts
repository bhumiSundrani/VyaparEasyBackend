import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { runCronJob } from "../controllers/cronJobs/runCronJob";

const router = Router()

router.get("/", authMiddleware, runCronJob)


export default router