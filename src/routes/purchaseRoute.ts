import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { createPurchase } from "../controllers/purchases/addPurchase";
import { getAllPurchases } from "../controllers/purchases/getAllPurchases";
import { editPurchase } from "../controllers/purchases/editPurchase";
import { getPurchaseById } from "../controllers/purchases/getPurchaseById";
import { deletePurchase } from "../controllers/purchases/deletePurchase";
import { updatePayment } from "../controllers/purchases/updatePayment";

const router = Router()

router.post("/", authMiddleware, createPurchase)

router.get("/", authMiddleware, getAllPurchases)

router.put("/edit-purchase/:id", authMiddleware, editPurchase)

router.get("/:id", authMiddleware, getPurchaseById)

router.delete("/:id", authMiddleware, deletePurchase)

router.put("/:id", authMiddleware, updatePayment)




export default router