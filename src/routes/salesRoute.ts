import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { createSales } from "../controllers/sales/createSales";
import { getAllSales } from "../controllers/sales/getAllSales";
import { editSales } from "../controllers/sales/editSales";
import { getSaleByID } from "../controllers/sales/getSaleById";
import { deleteSales } from "../controllers/sales/deleteSales";
import { updatePaymentSale } from "../controllers/sales/updatePayment";

const router = Router()

router.post("/", authMiddleware, createSales)

router.get("/", authMiddleware, getAllSales)

router.put("/edit-sales/:id", authMiddleware, editSales)

router.get("/:id", authMiddleware, getSaleByID)

router.delete("/:id", authMiddleware, deleteSales)

router.put("/:id", authMiddleware, updatePaymentSale)




export default router