import mongoose, {Schema, Document, Types} from 'mongoose'

export interface Category extends Document{
    _id: Types.ObjectId;
    name: string;
    parentCategory?: Types.ObjectId | null;
    imageUrl: string | null;
    slug: string;
    user: Types.ObjectId;
}

const CategorySchema : Schema<Category> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parentCategory: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    imageUrl: {
        type: String
    },
    slug: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

// Create compound indexes for name and slug to be unique per user
CategorySchema.index({ name: 1, user: 1 }, { unique: true });
CategorySchema.index({ slug: 1, user: 1 }, { unique: true });

const CategoryModel = 
    (mongoose.models.Category as mongoose.Model<Category>) ||
    mongoose.model<Category>('Category', CategorySchema)

export default CategoryModel