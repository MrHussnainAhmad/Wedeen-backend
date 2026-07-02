import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reflectionId: { type: String, required: true },
    date: { type: String, required: true },
    text: { type: String, required: true, maxlength: 5000 },
    createdAtClient: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

reflectionSchema.index({ userId: 1, reflectionId: 1 }, { unique: true });

export const Reflection = mongoose.model('Reflection', reflectionSchema);
