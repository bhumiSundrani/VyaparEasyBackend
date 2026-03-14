import mongoose, {Schema, Document, Types} from 'mongoose'

export interface OtpVerification extends Document {
    _id: Types.ObjectId;
    phone: string;
    otp: string;
    expiresAt: Date;
    isVerified: boolean
}

const OtpVerificationSchema : Schema<OtpVerification> = new Schema({
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        match: [/^\+91[6-9]\d{9}$/, "Phone must be in +91XXXXXXXXXX format"],
        trim: true
    },
    otp: {
        type: String,
        required: [true, "Otp is required"],
        match: [/^\d{6}$/, "OTP must be a 6-digit number."]
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }},{
    timestamps: true
})

const OtpVerificationModel = 
    (mongoose.models.OtpVerification as mongoose.Model<OtpVerification>) ||
    mongoose.model<OtpVerification>('OtpVerification', OtpVerificationSchema)

export default OtpVerificationModel