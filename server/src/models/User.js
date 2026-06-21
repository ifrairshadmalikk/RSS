import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'viewer' },
    profilePicture: String,
    bio: String,
    preferredCountries: [{ type: String }],
    preferredCategories: [{ type: String }],
    notificationsEnabled: { type: Boolean, default: true },
    browserNotificationsEnabled: { type: Boolean, default: false },
    emailAlertsEnabled: { type: Boolean, default: false },
    pdfAlertsEnabled: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
