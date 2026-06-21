import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    message: { type: String, required: true },
    mentions: Number,
    category: { type: String, default: 'General' },
    country: { type: String, default: 'Global' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
