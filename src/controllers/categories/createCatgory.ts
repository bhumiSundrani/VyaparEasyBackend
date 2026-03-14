import { fetchImageForCategory } from "../../lib/fetchImages/fetchImageForCategory";
import CategoryModel from "../../models/Category.model";
import { categoryVerificationSchema } from "../../schemas/categoryVerificationSchema";
import { invalidateCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function createCategory(req: AuthRequest, res: Response){
    try {
        const body = req.body
        const parsedBody = categoryVerificationSchema.safeParse(body)
        if (!parsedBody.success) {
    const errors: Record<string, string> = {};

    parsedBody.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === "string") {
            errors[field] = issue.message;
        } else {
            errors["_form"] = issue.message;
        }
    });

            return res.status(400).json({ success: false, errors });
        }

        const user = req.user as User

        const {name, parentCategory} = parsedBody.data
        const slug = name.toLowerCase().replace(/\s+/g, '-')

        // Check if category with same name exists for this user
        const existingCategory = await CategoryModel.findOne({ 
            name,
            user: new mongoose.Types.ObjectId(user.userId)
        });
        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "A category with this name already exists",
            });
        }

        // Fetch image from Pexels
        const imageUrl = await fetchImageForCategory(name);

        const category = await CategoryModel.create({
            name, 
            parentCategory, 
            slug,
            imageUrl,
            user: new mongoose.Types.ObjectId(user.userId)
        });
        console.log("Invalidating Cache: ", req.originalUrl)
        await invalidateCache(`${req.originalUrl}:${user.userId}`)

        return res.status(200).json({
            success: true,
            message: "New category created",
            category
        })

    } catch (error) {
        console.error("Error creating new category:", error)
        return res.status(500).json({
            success: false,
            message: "Error creating new category"
        })
    }
}