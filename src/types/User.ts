import { ObjectId } from "mongoose";

export interface User{
    userId: string;
    phone: string;
    name: string;
    shopName: string;
    preferredLanguage: 'en' | 'hi' | 'bn' | 'ta' | 'mr' | 'te' | 'gu' | 'kn';
}