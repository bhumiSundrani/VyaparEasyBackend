import CategoryModel from "../../models/Category.model";
import ProductModel from "../../models/Product.model";
import mongoose from "mongoose";
import { setCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";


export async function getAllProducts(req: AuthRequest, res: Response){
    try {
       
        const user = req.user as User

        const products = await ProductModel.find({ user: new mongoose.Types.ObjectId(user.userId) }).populate({
            path: 'category',
            select: 'name'
        }).sort({updatedAt: -1, createdAt: -1 });

        const responseData = {
        success: true,
        message: products.length > 0 ? "Products found successfully" : "No products found",
        products,
      }
        await setCache(`${req.originalUrl}:${user.userId}`, responseData, 120);

        return res.status(200).json(
        responseData);
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching products",
            products: []
        })
    }
}