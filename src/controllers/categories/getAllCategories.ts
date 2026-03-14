import { fetchImageForCategory } from "../../lib/fetchImages/fetchImageForCategory";
import CategoryModel from "../../models/Category.model";
import { categoryVerificationSchema } from "../../schemas/categoryVerificationSchema";
import { invalidateCache, setCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function getAllCategories(req: AuthRequest, res: Response){
    try {

        const user = req.user as User

        const categories = await CategoryModel.find({ user: new mongoose.Types.ObjectId(user.userId)}).populate("parentCategory", "name") .sort({updatedAt: -1, createdAt: -1 }); ;
        
        if(!categories || categories.length === 0){
            return res.status(200).json({
                success: false,
                message: "No categories found",
        })
        }

        const responseData = {
            success: true,
            message: "Categories found successfully",
            categories
        }

        await setCache(`${req.originalUrl}:${user.userId}`, responseData, 3600)

        return res.status(200).json(responseData)
    } catch (error) {
        console.error("Error fetching categories:", error)
        return res.status(500).json({
            success: false,
            message: "Error fetching categories",
            categories: []
        })
    }
}