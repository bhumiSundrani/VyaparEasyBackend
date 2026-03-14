import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { getParties } from "../controllers/parties/getParties";

const router = Router()

router.post("/", authMiddleware, getParties)


export default router