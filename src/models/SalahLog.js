import mongoose from 'mongoose';

const salahLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    prayerName: {
      type: String,
      required: true,
      enum: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    },
    status: {
      type: String,
      required: true,
      enum: ['prayed', 'missed', 'pending', 'upcoming'],
    },
    prayedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

salahLogSchema.index({ userId: 1, date: 1, prayerName: 1 }, { unique: true });

export const SalahLog = mongoose.model('SalahLog', salahLogSchema);
