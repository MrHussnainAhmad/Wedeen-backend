import mongoose from 'mongoose';

const placeFavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    placeId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['mosque', 'restaurant', 'prayer_space'], required: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: '' },
    rating: { type: Number, default: null },
    hasPrayerSpace: { type: Boolean, default: false },
    halalCertified: { type: Boolean, default: false },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

placeFavoriteSchema.index({ userId: 1, placeId: 1 }, { unique: true });

export const PlaceFavorite = mongoose.model('PlaceFavorite', placeFavoriteSchema);
