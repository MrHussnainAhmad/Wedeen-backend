import mongoose from 'mongoose';

const memorizationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    surahNumber: { type: Number, required: true, min: 1, max: 114, index: true },
    ayahNumber: { type: Number, required: true, min: 1 },
    memorized: { type: Boolean, default: false },
    lastReviewed: { type: Date, default: null },
    nextReview: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

memorizationSchema.index({ userId: 1, surahNumber: 1, ayahNumber: 1 }, { unique: true });
memorizationSchema.index({ userId: 1, memorized: 1 });

export const Memorization = mongoose.model('Memorization', memorizationSchema);
