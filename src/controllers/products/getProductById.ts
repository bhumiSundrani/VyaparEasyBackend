import { Response } from "express";
import ProductModel from "../../models/Product.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";

export async function getProductByID(
  req: AuthRequest,
  res: Response
) {
 
  const { id } = req.params

  try {
    
        const user = req.user as User
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json(
        {
          success: false,
          message: "No product found",
          product: null,
        }
      );
    }

    return res.status(200).json(
      {
        success: true,
        message: "Product found successfully",
        product,
      }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json(
      {
        success: false,
        message: "Error fetching product",
        product: null,
      }
    );
  }
}