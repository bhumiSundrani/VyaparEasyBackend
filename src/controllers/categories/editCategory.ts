import CategoryModel from "../../models/Category.model";
import { categoryVerificationSchema } from "../../schemas/categoryVerificationSchema";
import { fetchImageForCategory } from "../../lib/fetchImages/fetchImageForCategory";
import { invalidateCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function editCategory(req: AuthRequest, res: Response) {
    try {
       
        const user = req.user as User
        const { categoryId } = req.params;
        if(typeof categoryId !== "string") return res.status(404).json({
            success: false,
            message: "Inavlid category Id"
        })
        const body = req.body;
        const parsedBody = categoryVerificationSchema.safeParse(body);

        if(!parsedBody.success){
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

        const {name, parentCategory} = parsedBody.data;

        const existingCategory = await CategoryModel.findById(new mongoose.Types.ObjectId(categoryId))

        if(!existingCategory){
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        if(name !== existingCategory.name){
            const duplicateCategory = await CategoryModel.findOne({name: existingCategory.name, _id: { $ne: new mongoose.Types.ObjectId(categoryId) }, user: new mongoose.Types.ObjectId(user.userId)})
            if(duplicateCategory){
                return res.status(400).json({
                    success: true,
                    message: "Category already exists"
                })
            }
        }

        const imageUrl = name !== existingCategory.name ? await fetchImageForCategory(name) : existingCategory.imageUrl

        const updatedCategory = await CategoryModel.findByIdAndUpdate(new mongoose.Types.ObjectId(categoryId), 
            { $set: {name, parentCategory: parentCategory ? new mongoose.Types.ObjectId(parentCategory) : null, imageUrl} },
            { new: true, runValidators: true }
        );

                await invalidateCache(`/api/categories:${user.userId}`)


        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating category"
        });
    }
}