import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    surahNameEnglish: { type: String, required: true },
    surahNameArabic: { type: String },
    ayahNumber: { type: Number, required: true },
    arabicText: { type: String, required: true },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

favoriteSchema.index({ userId: 1, surahNumber: 1, ayahNumber: 1 }, { unique: true });

export const Favorite = mongoose.model('Favorite', favoriteSchema);
