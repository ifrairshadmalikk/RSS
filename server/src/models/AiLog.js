import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    provider: String,
    status: { type: String, enum: ['success', 'failed'], required: true },
    message: String,
    durationMs: Number
  },
  { timestamps: true }
);

export const AiLog = mongoose.model('AiLog', aiLogSchema);
