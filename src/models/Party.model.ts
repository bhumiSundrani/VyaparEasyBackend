import mongoose, {Schema, Document, Types} from 'mongoose'

export interface Party extends Document{
    _id: Types.ObjectId;
    name: string;
    transactionId: Types.ObjectId[];
    phone: string;
    type: "customer" | "vendor";
    user: Types.ObjectId
}

const PartySchema : Schema<Party> = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    transactionId: [{
        type: Schema.Types.ObjectId,
        ref: "Transaction",
        required: true
    }],
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"],
        trim: true
    },
    type: {
        type: String,
        enum: ["customer", "vendor"],
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {timestamps: true})

PartySchema.index({ phone: 1 });
PartySchema.index({ user: 1 });
PartySchema.index({ paid: 1, dueDate: 1 });

const PartyModel = 
    (mongoose.models.Party as mongoose.Model<Party>) ||
    mongoose.model<Party>('Party', PartySchema)

export default PartyModel