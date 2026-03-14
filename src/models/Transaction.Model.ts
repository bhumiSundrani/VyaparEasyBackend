import mongoose, {Schema, Document, Types} from 'mongoose'

export interface Transaction extends Document{
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: "purchase" | "sale";
    paymentType: "cash" | "credit";
    customer?: {
        name: string;
        phone: string
    };
    supplier?: {
        name: string;
        phone: string
    };
    items: {
        productId: Types.ObjectId;
        productName: string;
        quantity: number;
        pricePerUnit: number;
        costPrice?: number
    }[];
    totalAmount: number;
    otherExpenses?: {
        name: string;
        amount: number
    }[],
    transactionDate: Date,
    dueDate?: Date,
    paid: boolean;
}

const TransactionSchema: Schema<Transaction> = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["purchase", "sale"],
        required: true
    },
    paymentType: {
        type: String,
        enum: ["cash", "credit"],
        required: true
    },
    customer: {
        name: {
            type: String
        },
        phone: {
            type: String,
            match: [/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"]
        }
    },
    supplier: {
        name: {
            type: String
        },
        phone: {
            type: String,
            match: [/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"]
        }
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        pricePerUnit: {
            type: Number,
            required: true
        },
        costPrice: {
            type: Number
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    otherExpenses: [{
        name: {
            type: String
        },
        amount: {
            type: Number
        }
    }],
    transactionDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    }, 
    paid: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: true
})

TransactionSchema.pre("validate", function () {
  if (this.type === "sale" && !this.customer) {
    throw new Error("Customer is required for a sale");
  }
  if (this.type === "purchase" && !this.supplier) {
    throw new Error("Supplier is required for a purchase");
  }
});

TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ userId: 1, type: 1, transactionDate: -1 });
TransactionSchema.index({ userId: 1, paymentType: 1 });
TransactionSchema.index({ userId: 1, type: 1, paymentType: 1 });
TransactionSchema.index({ "items.productId": 1 });


const TransactionModel = 
    (mongoose.models.Transaction as mongoose.Model<Transaction>) ||
    mongoose.model<Transaction>('Transaction', TransactionSchema)

export default TransactionModel