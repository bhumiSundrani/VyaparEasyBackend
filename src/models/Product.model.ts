import mongoose, {Schema, Document, Types} from 'mongoose'

export interface Product extends Document{
    _id: Types.ObjectId;
    name: string;
    brand: string;
    category: Types.ObjectId;
    unit: 'kg' | 'gm' | 'liter' | 'ml' | 'pcs'
    costPrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    currentStock: number;
    imageUrl: string | null;
    user: Types.ObjectId;
}

const ProductSchema : Schema<Product> = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    unit: {
        type: String,
        enum: ["kg", "gm", "liter", "ml", "pcs"],
        required: true
    },
    costPrice: {
        type: Number,
        min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: [0, 'Selling price cannot be negative']
    },
    lowStockThreshold: {
        type: Number,
        min: [0, 'Low stock threshold cannot be negative'],
        default: 10
    },
    currentStock: {
        type: Number,
        required: true,
        min: [0, 'Stock cannot be negative']
    },
    imageUrl: {
        type: String
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

// Add this line after schema definition
ProductSchema.index({ name: 1, user: 1 }, { unique: true });


const ProductModel = 
    (mongoose.models.Product as mongoose.Model<Product>) ||
    mongoose.model<Product>('Product', ProductSchema)

export default ProductModel