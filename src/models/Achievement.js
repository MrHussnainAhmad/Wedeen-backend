import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    achievementId: { type: String, required: true, index: true },
    currentValue: { type: Number, default: 0 },
    isUnlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

achievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const Achievement = mongoose.model('Achievement', achievementSchema);
