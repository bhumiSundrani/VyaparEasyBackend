import { Router } from "express";
import { authMiddleware } from "../middlewares/auth";
import { AuthRequest } from "../types/AuthRequest";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { User } from "../types/User";
import { createProduct } from "../controllers/products/createProduct";
import { getAllProducts } from "../controllers/products/getAllProducts";
import { getProductByID } from "../controllers/products/getProductById";
import { deleteProduct } from "../controllers/products/deleteProduct";
import { searchProducts } from "../controllers/products/searchProduct";

const router = Router()

router.post("/", authMiddleware, createProduct)

router.get("/", authMiddleware,  cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), getAllProducts)


router.get("/search", authMiddleware, searchProducts)

router.get("/:id", authMiddleware, getProductByID)

router.delete("/:id", authMiddleware, deleteProduct)




export default router