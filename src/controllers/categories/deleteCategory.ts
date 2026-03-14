import CategoryModel from "../../models/Category.model";
import { objectIdSchema } from "../../schemas/categoryVerificationSchema";
import { invalidateCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import { Response } from "express";
import mongoose from "mongoose";

export async function deleteCategory(req: AuthRequest, res: Response) {
    try {
        
                const user = req.user as User
        const { categoryId } = req.params;
        console.log("Category ID:", categoryId); // Debug log
        
        const parsedId = objectIdSchema.safeParse(categoryId);
        
        if(!parsedId.success){
            return res.status(400).json({
                success: false,
                message: "Invalid category ID"
            });
        }        
        if(!categoryId || typeof categoryId !== "string") return res.status(400).json({
            success: false,
            message: "CategoryId not found"
        })
        // Check if category exists
        const category = await CategoryModel.findById(new mongoose.Types.ObjectId(categoryId));
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if category has any subcategories
        const hasSubcategories = await CategoryModel.exists({ parentCategory: new mongoose.Types.ObjectId(categoryId) });
        if (hasSubcategories) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category with subcategories. Please delete all subcategories first."
            });
        }

        // Delete the category
        const deletedCategory = await CategoryModel.findByIdAndDelete(new mongoose.Types.ObjectId(categoryId));
        
        if (!deletedCategory) {
            return res.status(500).json({
                success: false,
                message: "Failed to delete category"
            });
        }

                await invalidateCache(`/api/categories:${user.userId}`)
        
        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
        
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
