import mongoose, {Schema, Document, Types} from 'mongoose'

export interface User extends Document{
    _id: Types.ObjectId;
    name: string;
    shopName: string;
    phone: string;
    preferredLanguage: 'en' | 'hi' | 'bn' | 'ta' | 'mr' | 'te' | 'gu' | 'kn';
    isVerified: boolean
}

const UserSchema : Schema<User> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    shopName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        unique: [true, "Phone number should be unique"],
        match: [/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"],
        trim: true
    },
    preferredLanguage: {
        type: String,
        enum: ["en", "hi", "bn", "ta", "mr", "te", "gu", "kn"],
        default: "en"
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {timestamps: true})

const UserModel = 
    (mongoose.models.User as mongoose.Model<User>) ||
    mongoose.model<User>('User', UserSchema)

export default UserModel