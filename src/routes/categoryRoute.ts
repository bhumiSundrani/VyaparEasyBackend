import { Router } from "express";
import { createCategory } from "../controllers/categories/createCatgory";
import { authMiddleware } from "../middlewares/auth";
import { AuthRequest } from "../types/AuthRequest";
import { cacheMiddleware } from "../middlewares/cacheMiddleware";
import { User } from "../types/User";
import { getAllCategories } from "../controllers/categories/getAllCategories";
import { getCategory } from "../controllers/categories/getCategory";
import { deleteCategory } from "../controllers/categories/deleteCategory";
import { editCategory } from "../controllers/categories/editCategory";
import { fixImages } from "../controllers/categories/fixImages";

const router = Router()

router.post("/", authMiddleware, createCategory)

router.get("/", authMiddleware,  cacheMiddleware((req: AuthRequest) => {
    const user = req.user as User
    return `${req.originalUrl}:${user.userId}`;
  }), getAllCategories)

router.get("/get-category/:categoryId", authMiddleware, getCategory)

router.delete("/delete-category/:categoryId", authMiddleware, deleteCategory)

router.put("/edit-category/:categoryId", authMiddleware, editCategory)

router.put("/fix-images", authMiddleware, fixImages)


export default router