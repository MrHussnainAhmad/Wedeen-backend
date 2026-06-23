import mongoose from 'mongoose';

const fastingLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'missed'],
      default: 'pending',
    },
    taraweehRakats: { type: Number, default: 0, min: 0 },
    suhoorAt: { type: Date, default: null },
    iftarAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

fastingLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const FastingLog = mongoose.model('FastingLog', fastingLogSchema);
