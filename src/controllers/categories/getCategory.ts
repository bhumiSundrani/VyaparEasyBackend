import { Response } from "express";
import CategoryModel from "../../models/Category.model";
import { objectIdSchema } from "../../schemas/categoryVerificationSchema";
import { AuthRequest } from "../../types/AuthRequest";
import mongoose from "mongoose";
export async function getCategory(req: AuthRequest, res: Response) {
    try {
        const { categoryId } = req.params;
        const parsedId = objectIdSchema.safeParse(categoryId);

        if(!categoryId || typeof categoryId !== "string" || !parsedId.success){
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }

        const category = await CategoryModel.findById(new mongoose.Types.ObjectId(categoryId)).populate("parentCategory", "name");
        if(!category){
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category found",
            category
        });
    } catch (error) {
        console.error("Error fetching category:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching category"
        });
    }
}