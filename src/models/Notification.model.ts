import mongoose, { Schema, Document, Types } from 'mongoose';

export interface Notification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  message: string;
  type: 'reminder' | 'stock_alert' | 'info' | 'error';
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<Notification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['reminder', 'stock_alert', 'info', 'error'],
    default: 'info',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const NotificationModel =
  (mongoose.models.Notification as mongoose.Model<Notification>) ||
  mongoose.model<Notification>('Notification', NotificationSchema);

export default NotificationModel;
