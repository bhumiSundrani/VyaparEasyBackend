import { fetchImageForProduct } from "../../lib/fetchImages/fetchImageForProduct";
import ProductModel from "../../models/Product.model";
import { productVerificationSchema } from "../../schemas/productVerificationSchema";
import mongoose from "mongoose";
import { invalidateCache } from "../../caching/setCache";
import { AuthRequest } from "../../types/AuthRequest";
import { Response } from "express";
import { User } from "../../types/User";

export async function createProduct(req: AuthRequest, res: Response) {
    const body = req.body
    const parsedBody = productVerificationSchema.safeParse(body);
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

    const {
        _id,
        name,
        brand,
        category,
        unit,
        costPrice,
        sellingPrice,
        lowStockThreshold,
        currentStock,
    } = parsedBody.data;

    try {
        // Get user from token
        
        const user = req.user as User

        if (_id) {
            // 🔁 UPDATE MODE
            const existingProduct = await ProductModel.findById(_id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }

            // Check for duplicate name only if name is being changed
            if (name !== existingProduct.name) {
                const duplicateName = await ProductModel.findOne({
                    name: name,
                    _id: { $ne: new mongoose.Types.ObjectId(_id) },
                    user: new mongoose.Types.ObjectId(user.userId) // Add user filter
                });

                if (duplicateName) {
                    return res.status(409).json({
                        success: false,
                        message: "Another product with this name already exists",
                    });
                }
            }

            // Get new image URL only if name has changed
            const imageUrl = name !== existingProduct.name 
                ? await fetchImageForProduct(name)
                : existingProduct.imageUrl;

            // Update the product
            const updatedProduct = await ProductModel.findByIdAndUpdate(
                _id,
                {
                    $set: {
                        name,
                        brand,
                        category,
                        unit,
                        costPrice,
                        sellingPrice,
                        lowStockThreshold,
                        currentStock,
                        imageUrl,
                        user: new mongoose.Types.ObjectId(user.userId) // Add user field
                    }
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedProduct) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to update product",
                });
            }

            console.log("Cache exhausted")
            await invalidateCache(`${req.originalUrl}:${user.userId}`)
                    await invalidateCache(`/api/dashboard/get-stats:${user.userId}`)

            return res.status(200).json({
                success: true,
                message: "Product updated successfully",
                product: updatedProduct
            });

        } else {
            // 🆕 CREATE MODE
            // Check if product with same name exists for this user
            const existingProduct = await ProductModel.findOne({ 
                name,
                user: new mongoose.Types.ObjectId(user.userId) // Add user filter
            });
            if (existingProduct) {
                return res.status(409).json({
                    success: false,
                    message: "A product with this name already exists",
                });
            }

            const imageUrl = await fetchImageForProduct(name);

            const newProduct = new ProductModel({
                name,
                brand,
                category,
                unit,
                costPrice,
                sellingPrice,
                lowStockThreshold,
                currentStock,
                imageUrl,
                user: new mongoose.Types.ObjectId(user.userId) // Add user field
            });

            const savedProduct = await newProduct.save();
      console.log("Exhausted cache data")

            await invalidateCache(`${req.originalUrl}:${user.userId}`)
            

            return res.status(201).json({
                success: true,
                message: "Product created successfully",
                product: savedProduct
            });
        }

    } catch (error) {
        console.error("Error saving product:", error);
        return res.status(500).json({
            success: false,
            message: "Error saving product",
        });
    }
}