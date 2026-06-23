import mongoose from 'mongoose';

const tasbihSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    count: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

tasbihSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Tasbih = mongoose.model('Tasbih', tasbihSchema);
