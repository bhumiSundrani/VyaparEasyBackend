import { Response } from "express";
import ProductModel from "../../models/Product.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function searchProducts(req: AuthRequest, res: Response) {
  try {
    
    const user = req.user as User
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query) {
      return res.status(400).json({ 
        success: true, 
        products: [],
        message: "No search query provided"
      });
    }
    // Enhanced search with multiple fields and user filtering
    const searchRegex = { $regex: query, $options: "i" };
    
    const products = await ProductModel.find({
  user: new mongoose.Types.ObjectId(user.userId),
  $or: [
    { name: searchRegex }
  ]
})
    .select('_id name sellingPrice costPrice currentStock unit category lowStockThreshold imageUrl')
    .limit(20)
    .sort({ name: 1 })
    .lean();

    return res.status(200).json({ 
      success: true, 
      products,
      count: products.length
    });

  } catch (error) {
    console.error("Error searching products:", error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`
      : "Failed to search products";

    return res.status(500).json(
      { success: false, message: errorMessage }
    );
  }
}