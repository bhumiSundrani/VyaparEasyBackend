import CategoryModel from "../../models/Category.model";
import axios from "axios";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";

export async function fixImages(req: AuthRequest, res: Response) {
    try {
        const categories = await CategoryModel.find();
        
        for (const category of categories) {
            if (category.imageUrl && category.imageUrl.includes('pexels.com/photo/')) {
                try {
                    const response = await axios.get('https://api.pexels.com/v1/search', {
                        headers: {"Authorization": process.env.PEXELS_API_KEY},
                        params: {query: category.name, per_page: 1}
                    });
                    
                    const photo = response.data.photos?.[0];
                    if (photo) {
                        category.imageUrl = photo.src.large2x;
                        await category.save();
                        console.log(`Updated image for category: ${category.name}`);
                    }
                } catch (error) {
                    console.error(`Error updating image for category ${category.name}:`, error);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Category images updated successfully"
        });
    } catch (error) {
        console.error("Error updating category images:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating category images"
        });
    }
} 