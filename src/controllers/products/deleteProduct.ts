import { Response } from "express";
import { invalidateCache } from "../../caching/setCache";
import ProductModel from "../../models/Product.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";

export async function deleteProduct(
  req: AuthRequest,
  res: Response
) {
  const { id } = req.params
  
  try {
    
            const user = req.user as User
    await ProductModel.findByIdAndDelete(id);
    await invalidateCache(`/api/products:${user.userId}`)
                        await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)

    return res.status(200).json(
      {
        success: true,
        message: "Product deleted successfully",
      }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json(
      {
        success: false,
        message: "Error deleting product",
        product: null,
      }
    );
  }
}