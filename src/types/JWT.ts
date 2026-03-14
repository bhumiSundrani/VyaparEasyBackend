import { ObjectId } from "mongoose";

export interface JWTToken {
    userId: string;
    phone: string;
    name: string;
    shopName: string;
    preferredLanguage: string;
    iat?: number;
    exp?: number;
} 