import { Response } from "express";
import { setCache } from "../../caching/setCache";
import { verifyToken } from "../../lib/jwtTokenManagement";
import ProductModel from "../../models/Product.model";
import { AuthRequest } from "../../types/AuthRequest";
import { User } from "../../types/User";
import mongoose from "mongoose";

export async function lowStockAlerts (req: AuthRequest, res: Response){
    
            const user = req.user as User
            
                
            try {
               const lowStockProducts = await ProductModel.find({
                    user: new mongoose.Types.ObjectId(user.userId),
                    $expr: {
                        $lte: ["$currentStock", "$lowStockThreshold"]
                    }   
                });

                const responseData = {
        success: true,
        message: "Low stock products received",
        lowStockProducts
    }

    await setCache(`${req.originalUrl}:${user.userId}`, responseData, 300);

    return res.status(200).json(responseData)


            } catch (error) {
                console.log("Error fetching low stock products: ", error)
                return res.status(500).json({
                        success: false,
                        message: "Error fetching low stock products"
                    })
            }

}