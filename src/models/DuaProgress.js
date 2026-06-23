import mongoose from 'mongoose';

const duaProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    duaId: { type: String, required: true },
    categoryId: { type: String, default: '' },
    readCount: { type: Number, default: 0, min: 0 },
    favorite: { type: Boolean, default: false },
    lastReadAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

duaProgressSchema.index({ userId: 1, duaId: 1 }, { unique: true });

export const DuaProgress = mongoose.model('DuaProgress', duaProgressSchema);
